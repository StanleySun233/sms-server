local util_webhook = {}

local pending_new_messages = {}
local pending_missed_calls = {}
local heartbeat_running = false
local SMS_RESULT_KEY = "sms_dispatch_result_v2"
local INBOX_PREFIX = "sms_inbox_"
local inbox_sequence = 0
local inbox_session = ("%x%08x"):format(os.time(), math.random(1, 0x7fffffff))
local BATCH_SIZE = 10
local MAX_BUFFERED = 100

local function queueEvent(queue, kind, event)
    if #pending_new_messages + #pending_missed_calls >= MAX_BUFFERED then
        log.error("util_webhook", "inbox_full", kind)
        return
    end
    inbox_sequence = inbox_sequence + 1
    event.eventId = ("%s-%d"):format(inbox_session, inbox_sequence)
    if not fskv.set(INBOX_PREFIX .. event.eventId, { kind = kind, event = event }) then
        log.warn("util_webhook", "inbox_flash_write_failed", event.eventId)
    end
    table.insert(queue, event)
end

local iter = fskv.iter()
if iter then
    while true do
        local key = fskv.next(iter)
        if not key then break end
        if key:sub(1, #INBOX_PREFIX) == INBOX_PREFIX then
            local row = fskv.get(key)
            if type(row) == "table" and type(row.event) == "table" then
                local queue = row.kind == "sms" and pending_new_messages or pending_missed_calls
                table.insert(queue, row.event)
            end
        end
    end
end

local function simNumber()
    local number = mobile.number(mobile.simid())
    if type(number) ~= "string" or number == "" then number = config.FALLBACK_LOCAL_NUMBER end
    if type(number) == "string" and number:match("^%+?%d+$") then return number end
end

local function simId()
    if type(mobile.iccid) ~= "function" then return nil end
    local id = mobile.iccid()
    if type(id) == "string" and id:match("^%d+$") and #id >= 15 and #id <= 24 then return id end
end

function util_webhook.addNewMessage(phone, content, timestamp)
    queueEvent(pending_new_messages, "sms", {
        phone = phone, content = content, timestamp = timestamp, receiverPhone = simNumber()
    })
end

function util_webhook.addMissedCall(phone, timestamp)
    queueEvent(pending_missed_calls, "call", { phone = phone, timestamp = timestamp })
end

local function buildRequest(messages, calls)
    local phone_number = simNumber()
    local imei_str = ""
    if mobile.imei then
        imei_str = tostring(mobile.imei()) or ""
    end
    local rsrp = mobile.rsrp()
    local device_info = {
        phoneNumber = phone_number,
        simId = simId(),
        imei = imei_str,
        signalStrength = type(rsrp) == "number" and rsrp or nil,
        batteryLevel = nil
    }
    local util_location = require("util_location")
    local lat, lng = util_location.get()
    if type(lat) == "number" and lat ~= 0 and type(lng) == "number" and lng ~= 0 then
        device_info.latitude = lat
        device_info.longitude = lng
    end
    local req = {
        deviceInfo = device_info,
        smsProtocol = type(sms.sendLong) == "function" and 2 or 0,
        deviceSession = inbox_session,
        newMessages = messages,
        missedCalls = calls
    }
    local result = fskv.get(SMS_RESULT_KEY)
    if type(result) == "table" then req.smsResults = { result } end
    return req
end

local function runCommands(commands)
    for _, cmd in ipairs(commands) do
        if cmd.type == "send_sms" and type(cmd.attemptId) == "string" and not fskv.get(SMS_RESULT_KEY) then
            -- Persist before transmission. A restart during transmission leaves an unknown outcome.
            local result = { attemptId = cmd.attemptId, status = "unknown" }
            if not fskv.set(SMS_RESULT_KEY, result) then return end
            if type(cmd.expectedSim) ~= "string" or cmd.expectedSim ~= simId() or type(cmd.phone) ~= "string"
                or type(cmd.content) ~= "string" or type(sms.sendLong) ~= "function" then
                result.status = "failed"
            else
                local ok, sent = pcall(function() return sms.sendLong(cmd.phone, cmd.content).wait() end)
                if ok and sent == true then
                    result.status = "submitted"
                elseif ok and sent == false then
                    result.status = "failed"
                end
            end
            fskv.set(SMS_RESULT_KEY, result)
            log.info("util_webhook", "sms_result", cmd.taskId, result.status)
        end
    end
end

local function postHeartbeat()
    local url = type(config.WEBUI_WEBHOOK_URL) == "string" and config.WEBUI_WEBHOOK_URL or ""
    if url == "" then
        local base = config.SMS_SERVER_URL
        local token = config.WEBHOOK_TOKEN
        if type(base) ~= "string" or base == "" or type(token) ~= "string" or token == "" then
            return
        end
        url = base:gsub("/+$", "") .. "/webhook/" .. token
    end
    local message_count = math.min(#pending_new_messages, BATCH_SIZE)
    local call_count = math.min(#pending_missed_calls, BATCH_SIZE)
    local messages, calls = {}, {}
    for i = 1, message_count do messages[i] = pending_new_messages[i] end
    for i = 1, call_count do calls[i] = pending_missed_calls[i] end
    local req = buildRequest(messages, calls)
    local body = json.encode(req)
    local headers = { ["Content-Type"] = "application/json" }
    local code, _, res_body = util_http.fetch(1000 * 30, "POST", url, headers, body)
    if code == 200 and type(res_body) == "string" and res_body ~= "" then
        local ok, res = pcall(json.decode, res_body)
        if ok and type(res) == "table" and type(res.commands) == "table"
            and type(res.acknowledgedAttempts) == "table" then
            local sent_result = req.smsResults and req.smsResults[1]
            if sent_result and type(res.acknowledgedAttempts) == "table" then
                for _, attempt in ipairs(res.acknowledgedAttempts) do
                    if attempt == sent_result.attemptId then fskv.del(SMS_RESULT_KEY) end
                end
            end
            local remaining_messages, remaining_calls = {}, {}
            for _, item in ipairs(messages) do fskv.del(INBOX_PREFIX .. item.eventId) end
            for _, item in ipairs(calls) do fskv.del(INBOX_PREFIX .. item.eventId) end
            for i = message_count + 1, #pending_new_messages do
                table.insert(remaining_messages, pending_new_messages[i])
            end
            for i = call_count + 1, #pending_missed_calls do
                table.insert(remaining_calls, pending_missed_calls[i])
            end
            pending_new_messages = remaining_messages
            pending_missed_calls = remaining_calls
            runCommands(res.commands)
        end
    end
end

function util_webhook.doHeartbeat()
    if heartbeat_running then return end
    heartbeat_running = true
    local ok = pcall(postHeartbeat)
    heartbeat_running = false
    if not ok then log.warn("util_webhook", "heartbeat_exception") end
end

return util_webhook

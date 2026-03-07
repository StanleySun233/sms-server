local util_webhook = {}

local pending_new_messages = {}
local pending_missed_calls = {}

function util_webhook.addNewMessage(phone, content, timestamp)
    table.insert(pending_new_messages, { phone = phone, content = content, timestamp = timestamp })
end

function util_webhook.addMissedCall(phone, timestamp)
    table.insert(pending_missed_calls, { phone = phone, timestamp = timestamp })
end

local function buildRequest()
    local phone_number = mobile.number(mobile.simid()) or config.FALLBACK_LOCAL_NUMBER or ""
    local imei_str = ""
    if mobile.imei then
        imei_str = tostring(mobile.imei()) or ""
    end
    local rsrp = mobile.rsrp()
    local device_info = {
        phoneNumber = phone_number,
        imei = imei_str,
        signalStrength = type(rsrp) == "number" and rsrp or nil,
        batteryLevel = nil
    }
    local req = {
        deviceInfo = device_info,
        newMessages = pending_new_messages,
        missedCalls = pending_missed_calls
    }
    return req
end

local function runCommands(commands)
    if type(commands) ~= "table" then return end
    for _, cmd in ipairs(commands) do
        if cmd.type == "send_sms" and type(cmd.phone) == "string" and type(cmd.content) == "string" and #cmd.phone >= 5 and #cmd.phone <= 20 then
            sms.send(cmd.phone, cmd.content)
            log.info("util_webhook", "send_sms", cmd.phone, cmd.taskId)
        end
    end
end

function util_webhook.doHeartbeat()
    local url = type(config.WEBUI_WEBHOOK_URL) == "string" and config.WEBUI_WEBHOOK_URL or ""
    if url == "" then
        local base = config.SMS_SERVER_URL
        local token = config.WEBHOOK_TOKEN
        if type(base) ~= "string" or base == "" or type(token) ~= "string" or token == "" then
            return
        end
        url = base:gsub("/+$", "") .. "/webhook/" .. token
    end
    local req = buildRequest()
    local body = json.encode(req)
    local headers = { ["Content-Type"] = "application/json" }
    local code, _, res_body = util_http.fetch(1000 * 30, "POST", url, headers, body)
    pending_new_messages = {}
    pending_missed_calls = {}
    if code == 200 and type(res_body) == "string" and res_body ~= "" then
        local ok, res = pcall(json.decode, res_body)
        if ok and res and type(res.commands) == "table" then
            runCommands(res.commands)
        end
    end
end

return util_webhook

local storage, sent, handler = {}, 0, nil
fskv = {
    get = function(key) return storage[key] end,
    set = function(key, value) storage[key] = value; return true end,
    del = function(key) storage[key] = nil; return true end,
    iter = function()
        local keys = {}
        for key in pairs(storage) do keys[#keys + 1] = key end
        return { keys = keys, position = 0 }
    end,
    next = function(iter)
        iter.position = iter.position + 1
        return iter.keys[iter.position]
    end
}
mobile = {
    number = function() return "10000" end,
    simid = function() return 0 end,
    iccid = function() return "11111111111111111111" end,
    rsrp = function() return -80 end
}
sms = { sendLong = function()
    sent = sent + 1
    return { wait = function() return true end }
end }
config = { WEBUI_WEBHOOK_URL = "https://example.invalid/api/webhook/test", NOTIFY_TYPE = {"webui"} }
log = { info = function() end, warn = function() end, error = function() end }
json = {}
local request, response
json.encode = function(value) request = value; return "request" end
json.decode = function() return response end
util_http = { fetch = function()
    local status
    status, response = handler(request)
    return status, {}, "response"
end }
package.preload.util_location = function() return { get = function() end } end
local webhook = dofile("device/util_webhook.lua")
webhook.addNewMessage("10001", "first", "2026-11-21T13:00:00")
handler = function(req)
    assert(#req.newMessages == 1)
    return 500
end
webhook.doHeartbeat()

-- A reboot reloads the offline event. An event received while posting belongs to the following batch.
webhook = dofile("device/util_webhook.lua")
local command = { type = "send_sms", taskId = "1", attemptId = "attempt-one",
    expectedSim = mobile.iccid(), phone = "10001", content = "test" }
handler = function(req)
    assert(#req.newMessages == 1 and req.newMessages[1].content == "first")
    webhook.addNewMessage("10002", "second", "2026-11-21T13:01:00")
    return 200, { commands = { command }, acknowledgedAttempts = {} }
end
webhook.doHeartbeat()
assert(sent == 1)

-- The rebooted device retains the result and won't call the modem twice for the same attempt.
webhook = dofile("device/util_webhook.lua")
handler = function(req)
    assert(#req.newMessages == 1 and req.newMessages[1].content == "second")
    assert(req.smsResults[1].attemptId == command.attemptId and req.smsResults[1].status == "submitted")
    return 200, { commands = { command }, acknowledgedAttempts = {} }
end
webhook.doHeartbeat()
assert(sent == 1)

handler = function(req)
    assert(#req.newMessages == 0)
    assert(req.smsResults[1].status == "submitted")
    return 200, { commands = {}, acknowledgedAttempts = { command.attemptId } }
end
webhook.doHeartbeat()
assert(not next(storage))
print("Firmware: persistence, in-flight events, replay and result acknowledgement passed")

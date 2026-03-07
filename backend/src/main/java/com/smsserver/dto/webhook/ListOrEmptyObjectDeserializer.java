package com.smsserver.dto.webhook;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public abstract class ListOrEmptyObjectDeserializer<T> extends JsonDeserializer<List<T>> {

    @Override
    public List<T> deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonNode node = p.getCodec().readTree(p);
        if (node.isArray()) {
            ObjectMapper mapper = (ObjectMapper) p.getCodec();
            List<T> result = new ArrayList<>();
            for (JsonNode elem : node) {
                result.add(mapper.treeToValue(elem, elementType()));
            }
            return result;
        }
        return Collections.emptyList();
    }

    protected abstract Class<T> elementType();

    public static class NewMessageListDeserializer extends ListOrEmptyObjectDeserializer<WebhookRequest.NewMessage> {
        @Override
        protected Class<WebhookRequest.NewMessage> elementType() {
            return WebhookRequest.NewMessage.class;
        }
    }

    public static class MissedCallListDeserializer extends ListOrEmptyObjectDeserializer<WebhookRequest.MissedCall> {
        @Override
        protected Class<WebhookRequest.MissedCall> elementType() {
            return WebhookRequest.MissedCall.class;
        }
    }
}

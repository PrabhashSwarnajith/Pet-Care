package com.petcare.backend.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class GeminiRequest {
    private List<Content> contents;

    @Data
    public static class Content {
        private String role;
        private List<Part> parts;
    }

    @Data
    public static class Part {
        private String text;
        private InlineData inlineData;
    }

    @Data
    public static class InlineData {
        private String mimeType;
        private String data; // Base64 encoded string
    }
}

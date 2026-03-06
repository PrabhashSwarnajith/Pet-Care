package com.petcare.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class ChatAssistantService {

    @Value("${groq.api.key}")
    private String apiKey;

    private static final String API_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "llama-3.3-70b-versatile";

    private final RestTemplate restTemplate = new RestTemplate();

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        return headers;
    }

    @SuppressWarnings("unchecked")
    private String extractContent(Map<String, Object> response) {
        if (response == null) return null;
        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        if (choices != null && !choices.isEmpty()) {
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            if (message != null) {
                return (String) message.get("content");
            }
        }
        return null;
    }

    public String chat(String userMessage) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", MODEL);
        requestBody.put("messages", List.of(
            Map.of("role", "user", "content",
                "You are a friendly pet health chatbot. Keep answer SHORT (2-3 sentences max), casual and helpful. Use simple language. Question: "
                    + userMessage)
        ));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, buildHeaders());

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                API_URL, HttpMethod.POST, entity,
                new ParameterizedTypeReference<>() {});
            String content = extractContent(response.getBody());
            return content != null ? content : "No response available.";
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode().value() == 429) {
                return "Service busy. Please wait a moment and try again.";
            }
            System.err.println("Service Error [" + e.getStatusCode() + "]: " + e.getResponseBodyAsString());
            return "Chat service error. Please try again later.";
        } catch (Exception e) {
            e.printStackTrace();
            return "Chat service error: " + e.getMessage();
        }
    }
}

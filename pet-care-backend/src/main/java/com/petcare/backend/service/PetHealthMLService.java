package com.petcare.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class PetHealthMLService {

    @Value("${google.gemini.api.key:}")
    private String mlApiKey;

    @Value("${groq.api.key:}")
    private String fallbackApiKey;

    private static final String ML_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    private static final String FALLBACK_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String FALLBACK_MODEL = "llama-3.3-70b-versatile";
    
    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings("unchecked")
    private String extractMLContent(Map<String, Object> response) {
        if (response == null) return null;
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates != null && !candidates.isEmpty()) {
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            if (content != null) {
                List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                if (parts != null && !parts.isEmpty()) {
                    return (String) parts.get(0).get("text");
                }
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private String extractFallbackContent(Map<String, Object> response) {
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

    private String analyzeFallback(String prompt, String description) {
        System.out.println("Using backup analysis service...");
        
        if (fallbackApiKey == null || fallbackApiKey.isBlank()) {
            return "Service unavailable. Please try again later.";
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", FALLBACK_MODEL);
        String briefPrompt = "You are a friendly pet health assistant. Keep response SHORT (3-4 sentences max), casual and helpful. Use simple words.\\n\\n" +
                "Based on: " + description + "\\n\\nGive brief assessment with possible causes and what to do.";
        requestBody.put("messages", List.of(
            Map.of("role", "user", "content", briefPrompt)
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(fallbackApiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                FALLBACK_API_URL, HttpMethod.POST, entity,
                new ParameterizedTypeReference<>() {});
            String content = extractFallbackContent(response.getBody());
            return content != null ? content : "No response available.";
        } catch (Exception e) {
            System.err.println("Backup service error: " + e.getMessage());
            return "Unable to analyze. Please describe the issue to your veterinarian.";
        }
    }

    public String analyzeWithImage(String base64Image, String mimeType, String prompt) {
        if (mlApiKey == null || mlApiKey.isBlank()) {
            System.out.println("No ML API configured - using backup service");
            return analyzeFallback(prompt, prompt);
        }

        Map<String, Object> requestBody = new HashMap<>();
        String briefPrompt = "You are a friendly pet health assistant. Keep response SHORT (3-4 sentences max), casual and helpful. Use simple words.\\n\\n" +
                prompt + "\\n\\nGive brief assessment with possible causes and what to do.";
        requestBody.put("contents", List.of(
            Map.of("parts", List.of(
                Map.of("text", briefPrompt),
                Map.of(
                    "inlineData", Map.of(
                        "mimeType", mimeType,
                        "data", base64Image
                    )
                )
            ))
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        String url = ML_API_URL + "?key=" + mlApiKey;

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, HttpMethod.POST, entity,
                new ParameterizedTypeReference<>() {});
            String content = extractMLContent(response.getBody());
            if (content != null && !content.isBlank()) {
                return content;
            }
        } catch (HttpClientErrorException e) {
            System.err.println("ML Service failed [" + e.getStatusCode() + "]: " + e.getResponseBodyAsString());
            return analyzeFallback(prompt, prompt);
        } catch (Exception e) {
            System.err.println("ML Service error: " + e.getMessage());
            return analyzeFallback(prompt, prompt);
        }
        
        return analyzeFallback(prompt, prompt);
    }
}

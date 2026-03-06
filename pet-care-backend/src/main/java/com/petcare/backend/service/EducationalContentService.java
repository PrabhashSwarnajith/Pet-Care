package com.petcare.backend.service;

import com.petcare.backend.entity.EducationalContent;

import java.util.List;

public interface EducationalContentService {
    List<EducationalContent> getAllContent();

    List<EducationalContent> getContentByCategory(String category);

    EducationalContent getContentById(Long id);

    EducationalContent createContent(String title, String content, String category, String type, String mediaUrl);

    EducationalContent updateContent(Long id, String title, String content, String category, String type,
            String mediaUrl);

    void deleteContent(Long id);
}

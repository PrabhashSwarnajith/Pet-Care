package com.petcare.backend.service.impl;

import com.petcare.backend.entity.EducationalContent;
import com.petcare.backend.repository.EducationalContentRepository;
import com.petcare.backend.service.EducationalContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EducationalContentServiceImpl implements EducationalContentService {

    private final EducationalContentRepository repository;

    @Override
    public List<EducationalContent> getAllContent() {
        return repository.findAll();
    }

    @Override
    public List<EducationalContent> getContentByCategory(String category) {
        return repository.findByCategory(category);
    }

    @Override
    public EducationalContent getContentById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Content not found"));
    }

    @Override
    public EducationalContent createContent(String title, String content, String category,
            String type, String mediaUrl) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Title is required.");
        }
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Content body is required.");
        }

        EducationalContent newContent = EducationalContent.builder()
                .title(title)
                .content(content)
                .category(category != null ? category.toUpperCase() : "GENERAL")
                .type(type != null ? type.toUpperCase() : "ARTICLE")
                .mediaUrl(mediaUrl)
                .build();

        return repository.save(newContent);
    }

    @Override
    public EducationalContent updateContent(Long id, String title, String content,
            String category, String type, String mediaUrl) {
        EducationalContent existing = getContentById(id);

        if (title != null && !title.isBlank())
            existing.setTitle(title);
        if (content != null && !content.isBlank())
            existing.setContent(content);
        if (category != null && !category.isBlank())
            existing.setCategory(category.toUpperCase());
        if (type != null && !type.isBlank())
            existing.setType(type.toUpperCase());
        if (mediaUrl != null)
            existing.setMediaUrl(mediaUrl);

        return repository.save(existing);
    }

    @Override
    public void deleteContent(Long id) {
        EducationalContent existing = getContentById(id);
        repository.delete(existing);
    }
}

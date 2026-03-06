package com.petcare.backend.service;

import com.petcare.backend.entity.SurgicalProcedure;
import com.petcare.backend.entity.User;

import java.time.LocalDateTime;
import java.util.List;

public interface SurgicalProcedureService {

    List<SurgicalProcedure> getSurgeriesForUser(String userEmail);

    List<User> listVets();

    SurgicalProcedure getSurgeryById(Long surgeryId, String userEmail);

    SurgicalProcedure scheduleSurgery(String ownerEmail, Long petId, Long vetId,
                                      String procedureName, LocalDateTime surgeryDateTime,
                                      String preOpInstructions);

    SurgicalProcedure updateStatus(Long surgeryId, String callerEmail, String newStatus);

    SurgicalProcedure addPostOpNotes(Long surgeryId, String vetEmail, String postOpNotes);

    SurgicalProcedure cancelSurgery(Long surgeryId, String callerEmail);

    void deleteSurgery(Long surgeryId, String userEmail);
}

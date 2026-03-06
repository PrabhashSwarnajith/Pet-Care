package com.petcare.backend.config;

import com.petcare.backend.entity.*;
import com.petcare.backend.entity.Consultation.Status;
import com.petcare.backend.entity.SurgicalProcedure.SurgicalStatus;
import com.petcare.backend.entity.AdoptionListing.AdoptionStatus;
import com.petcare.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PetRepository petRepository;
    private final AppointmentRepository appointmentRepository;
    private final ConsultationRepository consultationRepository;
    private final EducationalContentRepository educationalContentRepository;
    private final MedicationRepository medicationRepository;
    private final SurgicalProcedureRepository surgicalProcedureRepository;
    private final AdoptionListingRepository adoptionListingRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Only seed if the database is empty
        if (userRepository.count() > 0) return;

        String pass = passwordEncoder.encode("password123");

        // ── Users ──────────────────────────────────────────────────────────────

        User admin = userRepository.save(User.builder()
                .firstName("Admin").lastName("User")
                .email("admin@petcare.com").password(pass).role(User.Role.ADMIN).build());

        User vet1 = userRepository.save(User.builder()
                .firstName("Sarah").lastName("Mitchell")
                .email("vet.sarah@petcare.com").password(pass).role(User.Role.VET).build());

        User vet2 = userRepository.save(User.builder()
                .firstName("James").lastName("Carter")
                .email("vet.james@petcare.com").password(pass).role(User.Role.VET).build());

        User user1 = userRepository.save(User.builder()
                .firstName("Emily").lastName("Johnson")
                .email("emily@example.com").password(pass).role(User.Role.USER).build());

        User user2 = userRepository.save(User.builder()
                .firstName("Carlos").lastName("Rivera")
                .email("carlos@example.com").password(pass).role(User.Role.USER).build());

        User user3 = userRepository.save(User.builder()
                .firstName("Nina").lastName("Patel")
                .email("nina@example.com").password(pass).role(User.Role.USER).build());

        // ── Pets ───────────────────────────────────────────────────────────────

        Pet buddy = petRepository.save(Pet.builder()
                .name("Buddy").species("Dog").breed("Golden Retriever").age(3).weight(28.5)
                .medicalHistory("Vaccinated — Rabies, DHPP. Annual checkup due May 2026.")
                .owner(user1).build());

        Pet whiskers = petRepository.save(Pet.builder()
                .name("Whiskers").species("Cat").breed("Siamese").age(5).weight(4.2)
                .medicalHistory("Spayed. Slight dental plaque noted in last exam.")
                .owner(user1).build());

        Pet mango = petRepository.save(Pet.builder()
                .name("Mango").species("Bird").breed("Cockatiel").age(2).weight(0.1)
                .medicalHistory("Healthy. Wing clipping done Jan 2026.")
                .owner(user2).build());

        Pet rex = petRepository.save(Pet.builder()
                .name("Rex").species("Dog").breed("German Shepherd").age(4).weight(32.0)
                .medicalHistory("Hip dysplasia monitoring. On joint supplements.")
                .owner(user2).build());

        Pet luna = petRepository.save(Pet.builder()
                .name("Luna").species("Cat").breed("Persian").age(6).weight(5.0)
                .medicalHistory("Neutered. Chronic hairball issue — on specialized diet.")
                .owner(user3).build());

        Pet thumper = petRepository.save(Pet.builder()
                .name("Thumper").species("Rabbit").breed("Holland Lop").age(1).weight(1.8)
                .medicalHistory("Neutered. Healthy, no issues.")
                .owner(user3).build());

        Pet nemo = petRepository.save(Pet.builder()
                .name("Nemo").species("Fish").breed("Clownfish").age(1).weight(0.02)
                .medicalHistory("Fin rot treated Dec 2025. Recovered fully.")
                .owner(user1).build());

        Pet bella = petRepository.save(Pet.builder()
                .name("Bella").species("Dog").breed("Poodle").age(2).weight(6.5)
                .medicalHistory("Fully vaccinated. Mild allergies — on hypoallergenic diet.")
                .owner(user3).build());

        // ── Appointments (spread across recent months for chart data) ──────────

        // Past — 5 months ago
        appointmentRepository.save(Appointment.builder()
                .pet(buddy).owner(user1).vet(vet1)
                .appointmentTime(LocalDateTime.now().minusMonths(5).plusDays(2))
                .reason("Initial puppy vaccination booster")
                .status(Appointment.Status.COMPLETED)
                .serviceType(Appointment.ServiceType.VET_VISIT).build());

        // Past — 4 months ago
        appointmentRepository.save(Appointment.builder()
                .pet(rex).owner(user2).vet(vet1)
                .appointmentTime(LocalDateTime.now().minusMonths(4).plusDays(5))
                .reason("Hip dysplasia X-ray follow-up")
                .status(Appointment.Status.COMPLETED)
                .serviceType(Appointment.ServiceType.VET_VISIT).build());

        appointmentRepository.save(Appointment.builder()
                .pet(whiskers).owner(user1).vet(vet2)
                .appointmentTime(LocalDateTime.now().minusMonths(4).plusDays(12))
                .reason("Annual wellness check")
                .status(Appointment.Status.COMPLETED)
                .serviceType(Appointment.ServiceType.VET_VISIT).build());

        appointmentRepository.save(Appointment.builder()
                .pet(luna).owner(user3).vet(vet2)
                .appointmentTime(LocalDateTime.now().minusMonths(4).plusDays(18))
                .reason("Hairball management consultation")
                .status(Appointment.Status.COMPLETED)
                .serviceType(Appointment.ServiceType.VIDEO_CONSULTATION).build());

        // Past — 3 months ago
        appointmentRepository.save(Appointment.builder()
                .pet(buddy).owner(user1).vet(vet1)
                .appointmentTime(LocalDateTime.now().minusMonths(3).plusDays(3))
                .reason("Limping on front left leg — examination")
                .status(Appointment.Status.COMPLETED)
                .serviceType(Appointment.ServiceType.VET_VISIT).build());

        appointmentRepository.save(Appointment.builder()
                .pet(mango).owner(user2).vet(vet2)
                .appointmentTime(LocalDateTime.now().minusMonths(3).plusDays(10))
                .reason("Wing health check-up")
                .status(Appointment.Status.COMPLETED)
                .serviceType(Appointment.ServiceType.VET_VISIT).build());

        appointmentRepository.save(Appointment.builder()
                .pet(bella).owner(user3).vet(vet1)
                .appointmentTime(LocalDateTime.now().minusMonths(3).plusDays(14))
                .reason("Allergy testing and diet review")
                .status(Appointment.Status.COMPLETED)
                .serviceType(Appointment.ServiceType.VET_VISIT).build());

        // Past — 2 months ago
        appointmentRepository.save(Appointment.builder()
                .pet(rex).owner(user2).vet(vet1)
                .appointmentTime(LocalDateTime.now().minusMonths(2).plusDays(7))
                .reason("Hip supplement dosage review")
                .status(Appointment.Status.COMPLETED)
                .serviceType(Appointment.ServiceType.VIDEO_CONSULTATION).build());

        appointmentRepository.save(Appointment.builder()
                .pet(thumper).owner(user3).vet(vet2)
                .appointmentTime(LocalDateTime.now().minusMonths(2).plusDays(15))
                .reason("Post-neuter check-up")
                .status(Appointment.Status.COMPLETED)
                .serviceType(Appointment.ServiceType.VET_VISIT).build());

        appointmentRepository.save(Appointment.builder()
                .pet(whiskers).owner(user1).vet(vet2)
                .appointmentTime(LocalDateTime.now().minusMonths(2).plusDays(20))
                .reason("Dental plaque assessment")
                .status(Appointment.Status.COMPLETED)
                .serviceType(Appointment.ServiceType.VET_VISIT).build());

        // Past — 1 month ago
        appointmentRepository.save(Appointment.builder()
                .pet(buddy).owner(user1).vet(vet1)
                .appointmentTime(LocalDateTime.now().minusMonths(1).plusDays(4))
                .reason("Follow-up on leg injury")
                .status(Appointment.Status.COMPLETED)
                .serviceType(Appointment.ServiceType.VET_VISIT).build());

        appointmentRepository.save(Appointment.builder()
                .pet(luna).owner(user3).vet(vet2)
                .appointmentTime(LocalDateTime.now().minusMonths(1).plusDays(11))
                .reason("Weight management check")
                .status(Appointment.Status.COMPLETED)
                .serviceType(Appointment.ServiceType.VIDEO_CONSULTATION).build());

        appointmentRepository.save(Appointment.builder()
                .pet(bella).owner(user3).vet(vet1)
                .appointmentTime(LocalDateTime.now().minusMonths(1).plusDays(16))
                .reason("Allergy medication refill")
                .status(Appointment.Status.COMPLETED)
                .serviceType(Appointment.ServiceType.VET_VISIT).build());

        // Current month — past
        appointmentRepository.save(Appointment.builder()
                .pet(rex).owner(user2).vet(vet1)
                .appointmentTime(LocalDateTime.now().minusDays(10))
                .reason("Joint mobility assessment")
                .status(Appointment.Status.COMPLETED)
                .serviceType(Appointment.ServiceType.VET_VISIT).build());

        // Current week — upcoming
        appointmentRepository.save(Appointment.builder()
                .pet(buddy).owner(user1).vet(vet1)
                .appointmentTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0))
                .reason("Annual wellness check and vaccine booster")
                .status(Appointment.Status.SCHEDULED)
                .serviceType(Appointment.ServiceType.VET_VISIT).build());

        appointmentRepository.save(Appointment.builder()
                .pet(whiskers).owner(user1).vet(vet2)
                .appointmentTime(LocalDateTime.now().plusDays(2).withHour(14).withMinute(30))
                .reason("Dental cleaning consultation")
                .status(Appointment.Status.SCHEDULED)
                .serviceType(Appointment.ServiceType.VET_VISIT).build());

        appointmentRepository.save(Appointment.builder()
                .pet(rex).owner(user2).vet(vet1)
                .appointmentTime(LocalDateTime.now().plusDays(3).withHour(9).withMinute(0))
                .reason("Hip dysplasia follow-up X-ray")
                .status(Appointment.Status.SCHEDULED)
                .serviceType(Appointment.ServiceType.VET_VISIT).build());

        appointmentRepository.save(Appointment.builder()
                .pet(luna).owner(user3).vet(vet2)
                .appointmentTime(LocalDateTime.now().plusDays(5).withHour(11).withMinute(0))
                .reason("Diet review and weight management plan")
                .status(Appointment.Status.SCHEDULED)
                .serviceType(Appointment.ServiceType.VIDEO_CONSULTATION)
                .meetingLink("https://meet.google.com/sample-demo-link").build());

        appointmentRepository.save(Appointment.builder()
                .pet(thumper).owner(user3).vet(vet2)
                .appointmentTime(LocalDateTime.now().plusDays(6).withHour(15).withMinute(0))
                .reason("Routine wellness check")
                .status(Appointment.Status.SCHEDULED)
                .serviceType(Appointment.ServiceType.VET_VISIT).build());

        // ── Consultations (spread across months for chart data) ────────────────

        // 4 months ago
        Consultation c1 = consultationRepository.save(Consultation.builder()
                .pet(buddy).owner(user1).vet(vet1)
                .userDescription("Buddy has been limping on his front left leg for the past 2 days.")
                .aiPreliminaryDiagnosis("Possible sprain or soft-tissue injury. Recommend rest and vet examination to rule out fractures.")
                .vetFinalDiagnosis("Mild forelimb sprain. No fracture visible on X-ray.")
                .treatmentRecommendation("Rest for 7 days, anti-inflammatory meds (Carprofen 25mg twice daily for 5 days). Re-evaluate if limping persists.")
                .status(Status.VET_REVIEWED)
                .build());
        c1.setCreatedAt(LocalDateTime.now().minusMonths(4).plusDays(6));
        consultationRepository.save(c1);

        // 3 months ago
        Consultation c2 = consultationRepository.save(Consultation.builder()
                .pet(whiskers).owner(user1).vet(vet2)
                .userDescription("Whiskers has bad breath and is reluctant to eat dry food.")
                .aiPreliminaryDiagnosis("Signs consistent with dental disease — gingivitis or tooth resorption. Professional dental exam recommended.")
                .vetFinalDiagnosis("Stage 2 dental disease. Plaque buildup on molars.")
                .treatmentRecommendation("Schedule dental cleaning under anesthesia. Switch to dental-formula food in the interim.")
                .status(Status.VET_REVIEWED)
                .build());
        c2.setCreatedAt(LocalDateTime.now().minusMonths(3).plusDays(8));
        consultationRepository.save(c2);

        Consultation c3 = consultationRepository.save(Consultation.builder()
                .pet(rex).owner(user2)
                .userDescription("Rex is having difficulty getting up from lying down, especially in the morning.")
                .aiPreliminaryDiagnosis("Symptoms suggest joint stiffness or early osteoarthritis, consistent with hip dysplasia history. Recommend joint supplements and vet follow-up.")
                .status(Status.AI_REVIEWED)
                .build());
        c3.setCreatedAt(LocalDateTime.now().minusMonths(3).plusDays(15));
        consultationRepository.save(c3);

        // 2 months ago
        Consultation c4 = consultationRepository.save(Consultation.builder()
                .pet(luna).owner(user3).vet(vet2)
                .userDescription("Luna has been vomiting hairballs more frequently — about 3 times this week.")
                .aiPreliminaryDiagnosis("Increased hairball frequency may indicate excessive grooming due to stress or skin irritation. Dietary fiber supplementation may help.")
                .vetFinalDiagnosis("Chronic hairball condition. No underlying skin disease found.")
                .treatmentRecommendation("Add hairball-formula food, daily brushing, and Lactulose 5ml daily for 2 weeks.")
                .status(Status.VET_REVIEWED)
                .build());
        c4.setCreatedAt(LocalDateTime.now().minusMonths(2).plusDays(3));
        consultationRepository.save(c4);

        Consultation c5 = consultationRepository.save(Consultation.builder()
                .pet(mango).owner(user2)
                .userDescription("Mango has been sneezing a lot and has watery discharge from his nostrils.")
                .aiPreliminaryDiagnosis("Nasal discharge and sneezing in birds can suggest respiratory infection or environmental irritant. Vet evaluation recommended promptly.")
                .status(Status.AI_REVIEWED)
                .build());
        c5.setCreatedAt(LocalDateTime.now().minusMonths(2).plusDays(18));
        consultationRepository.save(c5);

        // 1 month ago
        Consultation c6 = consultationRepository.save(Consultation.builder()
                .pet(bella).owner(user3).vet(vet1)
                .userDescription("Bella has been scratching her ears constantly and shaking her head.")
                .aiPreliminaryDiagnosis("Symptoms suggest otitis externa (ear infection) or ear mites. Examination of ear canal and cytology recommended.")
                .vetFinalDiagnosis("Yeast infection in both ears (Malassezia). No mites found.")
                .treatmentRecommendation("Ear drops (Otomax) twice daily for 10 days. Clean ears weekly with medicated cleanser.")
                .status(Status.VET_REVIEWED)
                .build());
        c6.setCreatedAt(LocalDateTime.now().minusMonths(1).plusDays(5));
        consultationRepository.save(c6);

        Consultation c7 = consultationRepository.save(Consultation.builder()
                .pet(buddy).owner(user1)
                .userDescription("Buddy has a small lump on his left shoulder that appeared recently.")
                .aiPreliminaryDiagnosis("New lumps should always be evaluated. Could be a lipoma (benign) or other mass. Fine needle aspirate or biopsy recommended.")
                .status(Status.AI_REVIEWED)
                .build());
        c7.setCreatedAt(LocalDateTime.now().minusMonths(1).plusDays(12));
        consultationRepository.save(c7);

        Consultation c8 = consultationRepository.save(Consultation.builder()
                .pet(thumper).owner(user3).vet(vet2)
                .userDescription("Thumper isn't eating his pellets and is sitting hunched up.")
                .aiPreliminaryDiagnosis("Loss of appetite and hunched posture in rabbits can indicate GI stasis — a serious condition. Seek immediate vet care.")
                .vetFinalDiagnosis("Mild GI stasis. No obstruction found on palpation.")
                .treatmentRecommendation("Metaclopramide 0.5mg/kg, critical care syringe feeding every 4 hours, unlimited hay. Reassess in 24 hours.")
                .status(Status.VET_REVIEWED)
                .build());
        c8.setCreatedAt(LocalDateTime.now().minusMonths(1).plusDays(20));
        consultationRepository.save(c8);

        // Current month
        Consultation c9 = consultationRepository.save(Consultation.builder()
                .pet(rex).owner(user2)
                .userDescription("Rex yelps when I touch his lower back near the tail.")
                .aiPreliminaryDiagnosis("Pain in the lumbosacral area may indicate disc disease, nerve compression, or muscle strain. Imaging and physical exam recommended.")
                .status(Status.PENDING)
                .build());
        c9.setCreatedAt(LocalDateTime.now().minusDays(5));
        consultationRepository.save(c9);

        consultationRepository.save(Consultation.builder()
                .pet(whiskers).owner(user1)
                .userDescription("Whiskers has been drinking a lot more water than usual for the past week.")
                .aiPreliminaryDiagnosis("Increased water intake (polydipsia) in cats can indicate kidney disease, diabetes, or hyperthyroidism. Blood work is recommended.")
                .status(Status.AI_REVIEWED)
                .build());

        // ── Educational Content ─────────────────────────────────────────────────

        educationalContentRepository.save(EducationalContent.builder()
                .title("Nutrition Guide: Feeding Your Dog Right")
                .content("A balanced diet is the foundation of your dog's health. Dogs need protein, fats, carbohydrates, vitamins, and minerals in the right proportions.\n\n" +
                        "**Protein** should come from quality sources like chicken, beef, or fish — it supports muscle growth and repair.\n\n" +
                        "**Fats** provide energy and keep the coat shiny. Look for omega-3 and omega-6 fatty acids.\n\n" +
                        "**Avoid these foods:** chocolate, grapes, raisins, onions, garlic, xylitol (an artificial sweetener found in many products), and macadamia nuts — all are toxic to dogs.\n\n" +
                        "**Feeding schedule:** Puppies (under 6 months) need 3-4 meals per day. Adult dogs do well with 2 meals. Senior dogs may benefit from smaller, more frequent meals.\n\n" +
                        "Always provide fresh, clean water. Obesity is one of the most common and preventable health issues in dogs — measure portions carefully.")
                .category("NUTRITION").type("ARTICLE").build());

        educationalContentRepository.save(EducationalContent.builder()
                .title("Understanding Cat Vaccination Schedules")
                .content("Vaccines protect your cat from serious infectious diseases. Here is a clear breakdown of what your cat needs and when.\n\n" +
                        "**Core vaccines (all cats need these):**\n" +
                        "- FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia) — first dose at 6-8 weeks, boosters every 3-4 weeks until 16 weeks, then every 1-3 years.\n" +
                        "- Rabies — first dose at 12-16 weeks, booster at 1 year, then every 1-3 years depending on vaccine type.\n\n" +
                        "**Non-core vaccines (based on lifestyle):**\n" +
                        "- FeLV (Feline Leukemia) — recommended for outdoor cats or those exposed to other cats.\n" +
                        "- Bordetella — if your cat visits grooming salons or boarding facilities.\n\n" +
                        "Keep your vaccination records in a safe place. Most vets and boarding facilities require up-to-date records.")
                .category("HEALTH").type("ARTICLE").build());

        educationalContentRepository.save(EducationalContent.builder()
                .title("Basic Dog Training: Sit, Stay, Come")
                .content("Training your dog builds trust and keeps them safe. The three most important commands every dog should know are Sit, Stay, and Come.\n\n" +
                        "**Sit:**\n" +
                        "Hold a treat close to your dog's nose, then move your hand up — this causes the bottom to lower. Once in the sitting position, say 'Sit', give the treat, and praise warmly. Repeat 5 times per session.\n\n" +
                        "**Stay:**\n" +
                        "Ask your dog to Sit. Open your palm in front of you and say 'Stay'. Take a few steps back. If they stay, reward them. Gradually increase the distance over days.\n\n" +
                        "**Come:**\n" +
                        "Put a leash and collar on your dog. Get down to their level and say 'Come' while gently pulling the leash. When they reach you, reward with a treat and affection.\n\n" +
                        "**Tips:** Always use positive reinforcement — never punish. Keep sessions short (5-10 minutes). Practice in a quiet area before adding distractions.")
                .category("TRAINING").type("ARTICLE").build());

        educationalContentRepository.save(EducationalContent.builder()
                .title("Recognizing Signs of Illness in Pets")
                .content("Pets cannot tell us when they feel unwell. Knowing the warning signs can save your pet's life.\n\n" +
                        "**Contact your vet immediately if you see:**\n" +
                        "- Difficulty breathing or persistent coughing\n" +
                        "- Sudden collapse or seizures\n" +
                        "- Uncontrolled bleeding\n" +
                        "- Suspected poisoning (vomiting, trembling, drooling)\n" +
                        "- Eye injuries\n\n" +
                        "**Schedule a vet visit if you notice:**\n" +
                        "- Decreased appetite lasting more than 24 hours\n" +
                        "- Lethargy or sudden behavior changes\n" +
                        "- Excessive thirst or urination\n" +
                        "- Vomiting or diarrhea more than once\n" +
                        "- Limping or difficulty moving\n" +
                        "- Unusual lumps or swellings\n\n" +
                        "Trust your instincts — you know your pet best. When in doubt, call your vet.")
                .category("HEALTH").type("ARTICLE").build());

        educationalContentRepository.save(EducationalContent.builder()
                .title("How to Introduce a New Pet to Your Home")
                .content("Bringing a new pet home is exciting, but it requires patience and planning — especially if you already have other animals.\n\n" +
                        "**For dogs meeting dogs:**\n" +
                        "Introduce them in a neutral outdoor space, both on leashes. Let them sniff briefly, then walk together. Avoid forcing them together — let it happen naturally over several sessions.\n\n" +
                        "**For cats meeting cats:**\n" +
                        "Keep the new cat in a separate room for 1-2 weeks. Swap bedding so they get used to each other's scent. Introduce through a cracked door before face-to-face meetings.\n\n" +
                        "**For dogs meeting cats:**\n" +
                        "Keep the dog on a leash. Let the cat approach at its own pace. Never force interaction. Ensure the cat has high escape routes (shelves, cat trees).\n\n" +
                        "Be patient — it can take weeks to months for pets to fully accept each other.")
                .category("GENERAL").type("ARTICLE").build());

        educationalContentRepository.save(EducationalContent.builder()
                .title("Pet First Aid Basics Every Owner Should Know")
                .content("Knowing basic first aid can stabilize your pet until you reach the vet.\n\n" +
                        "**Bleeding wounds:**\n" +
                        "Apply firm pressure with a clean cloth. Do not remove the cloth if it soaks through — add more on top. Keep the pet calm.\n\n" +
                        "**Choking:**\n" +
                        "If your pet is pawing at their mouth and struggling to breathe, open their mouth carefully and look inside. For small pets, hold them upside down briefly. For dogs, perform back blows between the shoulder blades. Seek emergency care.\n\n" +
                        "**Burns:**\n" +
                        "Cool the area with cool (not cold) water for 10 minutes. Do not apply butter or creams. Cover loosely with a clean bandage.\n\n" +
                        "**Seizures:**\n" +
                        "Clear the area of hard objects. Do not restrain the pet or put your hand near their mouth. Time the seizure. Get to a vet immediately if it lasts more than 5 minutes.\n\n" +
                        "Always have your emergency vet's number saved in your phone.")
                .category("HEALTH").type("ARTICLE").build());

        // ── Medications ────────────────────────────────────────────────────────

        medicationRepository.save(Medication.builder()
                .name("Carprofen (Rimadyl)").dosage("75mg").frequency("Twice daily")
                .startDate(LocalDate.now().minusDays(14)).endDate(LocalDate.now().plusDays(16))
                .notes("Anti-inflammatory for joint pain. Give with food. Monitor for stomach upset.")
                .pet(rex).owner(user2).build());

        medicationRepository.save(Medication.builder()
                .name("Omega-3 Fish Oil").dosage("1000mg capsule").frequency("Once daily")
                .startDate(LocalDate.now().minusDays(30)).endDate(null)
                .notes("Ongoing supplement for coat health and joint support.")
                .pet(rex).owner(user2).build());

        medicationRepository.save(Medication.builder()
                .name("Fenbendazole (Panacur)").dosage("250mg").frequency("Once daily for 3 days")
                .startDate(LocalDate.now().minusDays(60)).endDate(LocalDate.now().minusDays(57))
                .notes("Deworming treatment. Course completed successfully.")
                .pet(buddy).owner(user1).build());

        medicationRepository.save(Medication.builder()
                .name("Lactulose Syrup").dosage("5ml").frequency("Once daily")
                .startDate(LocalDate.now().minusDays(7)).endDate(LocalDate.now().plusDays(7))
                .notes("For hairball and constipation management.")
                .pet(luna).owner(user3).build());

        // ── Surgical Procedures ────────────────────────────────────────────────

        surgicalProcedureRepository.save(SurgicalProcedure.builder()
                .procedureName("Hip Dysplasia Corrective Surgery (FHO)")
                .preOpInstructions("Fast Rex for 12 hours before surgery. No water after midnight. Bring all X-rays.")
                .surgeryDateTime(LocalDateTime.now().plusDays(14))
                .status(SurgicalStatus.SCHEDULED)
                .pet(rex).owner(user2).vet(vet1).build());

        surgicalProcedureRepository.save(SurgicalProcedure.builder()
                .procedureName("Dental Extraction (Tooth 308)")
                .preOpInstructions("Fast for 8 hours. Pre-surgical bloodwork required. Arrive 30 minutes early.")
                .surgeryDateTime(LocalDateTime.now().minusDays(5))
                .postOpNotes("Extraction successful. No complications. Soft food diet for 7 days. Recheck in 2 weeks.")
                .status(SurgicalStatus.COMPLETED)
                .pet(whiskers).owner(user1).vet(vet2).build());

        surgicalProcedureRepository.save(SurgicalProcedure.builder()
                .procedureName("Mass Removal (Skin Lump — Left Shoulder)")
                .preOpInstructions("Blood panel required 48 hours before. Keep area clean. No lotions or sprays on skin.")
                .surgeryDateTime(LocalDateTime.now().plusDays(21))
                .status(SurgicalStatus.SCHEDULED)
                .pet(buddy).owner(user1).vet(vet1).build());

        // ── Adoption Listings ──────────────────────────────────────────────────

        adoptionListingRepository.save(AdoptionListing.builder()
                .petName("Biscuit").species("Dog").breed("Beagle Mix").ageYears(2).gender("Male")
                .description("Biscuit is a playful and energetic beagle mix who loves walks, fetch, and cuddles. He is great with older children and gets along with other dogs. House-trained and crate-trained. Looking for an active family who will give him lots of love and outdoor time.")
                .imageUrl("https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400")
                .location("Austin, TX")
                .status(AdoptionStatus.AVAILABLE)
                .listedBy(user2).build());

        adoptionListingRepository.save(AdoptionListing.builder()
                .petName("Pearl").species("Cat").breed("Maine Coon").ageYears(3).gender("Female")
                .description("Pearl is a gentle, affectionate Maine Coon who loves being brushed and sitting in laps. She is calm, quiet, and perfect for apartment living. Gets along well with other cats. Spayed and fully vaccinated.")
                .imageUrl("https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400")
                .location("Denver, CO")
                .status(AdoptionStatus.AVAILABLE)
                .listedBy(user3).build());

        adoptionListingRepository.save(AdoptionListing.builder()
                .petName("Ziggy").species("Rabbit").breed("Holland Lop").ageYears(1).gender("Male")
                .description("Ziggy is an adorable Holland Lop who is litter-trained and loves to explore. He enjoys leafy greens, tunnels, and morning zoomies. Ideal for a calm household. Neutered.")
                .imageUrl("https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400")
                .location("Seattle, WA")
                .status(AdoptionStatus.AVAILABLE)
                .listedBy(user1).build());

        adoptionListingRepository.save(AdoptionListing.builder()
                .petName("Shadow").species("Dog").breed("Labrador Mix").ageYears(5).gender("Male")
                .description("Shadow is a loyal and calm 5-year-old Lab mix. He has been with the same family for 4 years but they are relocating internationally. He knows basic commands, loves swimming, and is gentle with children. Fully vaccinated and microchipped.")
                .imageUrl("https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400")
                .location("Chicago, IL")
                .status(AdoptionStatus.PENDING)
                .listedBy(user1).adoptedBy(user3).build());

        System.out.println("===========================================");
        System.out.println("  Sample data loaded successfully!");
        System.out.println("  Accounts (password: password123):");
        System.out.println("    admin@petcare.com       (Admin)");
        System.out.println("    vet.sarah@petcare.com   (Vet)");
        System.out.println("    vet.james@petcare.com   (Vet)");
        System.out.println("    emily@example.com       (User - 3 pets)");
        System.out.println("    carlos@example.com      (User - 2 pets)");
        System.out.println("    nina@example.com        (User - 3 pets)");
        System.out.println("===========================================");
    }
}

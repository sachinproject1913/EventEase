import React, { useState } from 'react';
import { 
  Database, 
  Server, 
  Code2, 
  Terminal, 
  Copy, 
  Check, 
  ShieldCheck, 
  Layers,
  QrCode,
  FileCheck2,
  Cpu,
  ArrowRight
} from 'lucide-react';

export const BackendArchitectureModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'schema' | 'controllers' | 'frontend' | 'run'>('architecture');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const architecturalLogicDoc = `=======================================================================
EVENTEASETM / CAMPUSGUARD — INTEGRATED ARCHITECTURAL LOGIC & SYSTEM WORKFLOW
University Event Management, Dynamic QR Attendance & HOD Exemption System
=======================================================================

1. ORGANIZER EVENT CREATION & TEMPLATE INITIALIZATION:
-----------------------------------------------------------------------
• When an organizer creates a new event (POST /api/events), the server executes an atomic transaction:
  a. Inserts event record into \`events\` table with title, date, duration, venue, max capacity, and department.
  b. Auto-initializes a formal HOD leave application template in \`leave_forms\` mapped specifically to the event:
     - Formulated with event title, start & end timestamps, venue, and faculty coordinator credentials.
     - Sets default status to AVAILABLE (is_available = true) with Dean approved phrasing.
     - Stores deterministic template tokens: [STUDENT_NAME], [ROLL_NUMBER], [DEPARTMENT], [COURSE], [EVENT_DATES].
  c. Assigns a cryptographic Event Secret Token used for venue verification.

2. DYNAMIC QR CODE GENERATION:
-----------------------------------------------------------------------
• Dynamic QR Code is automatically synthesized on event publication (GET /api/events/{id}/qr):
  - Encodes a JSON payload signed with HMAC-SHA256:
    {
      "eventId": "evt-301",
      "timestamp": 1729065600000,
      "venueSecret": "EVENTEASE-SEC-8942-X",
      "action": "ATTENDANCE_CHECKIN"
    }
  - Displayed on the Organizer's Dashboard and projectable on venue screens / printed badges.
  - Refreshable or static per security requirements with configurable expiration windows.

3. QR ATTENDANCE SCANNING & SUBMISSION:
-----------------------------------------------------------------------
• Physical Check-In Workflow:
  a. Student attends physical venue and scans the venue QR code using mobile device or in-portal scanner.
  b. Scanning triggers the secure check-in endpoint (POST /api/attendance/verify):
     - Payload: { eventId, studentId, registrationCode }
  c. Backend validation engine:
     - Confirms student has a valid, active registration in \`event_registrations\`.
     - Validates student's unique Registration Number (e.g., CG-REG-8921-X) against database record.
     - Checks timestamp to ensure check-in occurs within permitted event attendance window.
  d. Instant persistence:
     - Updates \`event_registrations.attendance_status\` = 'PRESENT'.
     - Inserts immutable audit entry in \`event_attendance_logs\` with timestamp, client IP, and verification method ('QR_SCAN').

4. LEAVE FORM UNLOCKING & DOWNLOAD:
-----------------------------------------------------------------------
• Clearance Exemption Document Generation:
  a. The system strictly gates leave form generation behind attendance status = 'PRESENT'.
  b. Unlocked student triggers (GET /api/leave-forms/{eventId}/download):
     - Server retrieves student profile (Name, Roll No, Department, Course, Semester) and event record.
     - Deterministic OpenPDF engine compiles a formal, official 1-page Academic Leave Exemption Letter addressed to the Head of Department (HOD).
     - Incorporates University Seal watermark, verification hash, and signature blocks.
  c. Download audit:
     - Sets \`event_registrations.personal_application_downloaded\` = true.
     - Increments download telemetry in MySQL database.
     - Student submits physical signed copy to HOD for authorized attendance regularization.
`;

  const databaseSchemaSql = `-- =======================================================================
-- EVENTEASE / CAMPUSGUARD — PRODUCTION MYSQL 8.0+ RELATIONAL SCHEMA
-- Relational Adjustments for Events, Registrations, Attendance & Leave Forms
-- =======================================================================

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'ORGANIZER', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    student_id VARCHAR(64) NULL, -- Roll / Matriculation Number
    course VARCHAR(255) NULL,     -- e.g. B.Tech Computer Science & Eng.
    department VARCHAR(255) NULL, -- e.g. Department of Computer Science
    academic_year VARCHAR(64) NULL, -- e.g. 3rd Year / 6th Semester
    phone VARCHAR(32) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. EVENTS TABLE (With Dynamic QR Secrets & Lifecycle Status)
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('HACKATHON', 'TECHNICAL', 'CULTURAL', 'WORKSHOP', 'SEMINAR', 'SPORTS') NOT NULL DEFAULT 'TECHNICAL',
    organizer_id VARCHAR(64) NOT NULL,
    organizer_club VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    registration_deadline DATETIME NOT NULL,
    max_seats INT NOT NULL DEFAULT 100,
    registered_count INT NOT NULL DEFAULT 0,
    banner_image_url VARCHAR(512),
    approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'APPROVED',
    status ENUM('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PUBLISHED',
    requires_hod_approval BOOLEAN NOT NULL DEFAULT TRUE,
    event_secret_token VARCHAR(128) NOT NULL, -- Cryptographic secret for venue QR validation
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_organizer FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_event_dates (start_date, end_date),
    INDEX idx_event_status (status, approval_status),
    FULLTEXT INDEX ft_event_search (title, description, venue, organizer_club)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. LEAVE FORM TEMPLATES (Auto-initialized on Event Creation or Uploaded by Organizer)
CREATE TABLE IF NOT EXISTS leave_forms (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL UNIQUE,
    organizer_id VARCHAR(64) NOT NULL,
    template_type ENUM('SYSTEM_INITIALIZED', 'ORGANIZER_CUSTOM_PDF') NOT NULL DEFAULT 'SYSTEM_INITIALIZED',
    file_name VARCHAR(255) NOT NULL,
    file_storage_path VARCHAR(512) NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    mime_type VARCHAR(64) NOT NULL DEFAULT 'application/pdf',
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    download_count INT NOT NULL DEFAULT 0,
    instructions TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_leave_organizer FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_leave_event (event_id),
    INDEX idx_leave_availability (is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. EVENT REGISTRATIONS (With Unique Registration Pass Number)
CREATE TABLE IF NOT EXISTS event_registrations (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL,
    student_id VARCHAR(64) NOT NULL,
    registration_code VARCHAR(32) NOT NULL UNIQUE, -- e.g. CG-REG-7421-B given to student upon registration
    status ENUM('CONFIRMED', 'CANCELLED', 'WAITLISTED') NOT NULL DEFAULT 'CONFIRMED',
    attendance_status ENUM('PENDING', 'PRESENT', 'ABSENT') NOT NULL DEFAULT 'PENDING',
    attendance_marked_at TIMESTAMP NULL,
    official_form_downloaded BOOLEAN NOT NULL DEFAULT FALSE,
    official_form_downloaded_at TIMESTAMP NULL,
    personal_application_downloaded BOOLEAN NOT NULL DEFAULT FALSE,
    personal_application_downloaded_at TIMESTAMP NULL,
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reg_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_reg_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_event_student UNIQUE (event_id, student_id),
    INDEX idx_reg_code (registration_code),
    INDEX idx_reg_attendance (event_id, attendance_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. ATTENDANCE AUDIT LOGS (Immutable Physical Presence Records)
CREATE TABLE IF NOT EXISTS event_attendance_logs (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL,
    student_id VARCHAR(64) NOT NULL,
    registration_id VARCHAR(64) NOT NULL,
    verification_method ENUM('QR_SCAN', 'MANUAL_ORGANIZER_OVERRIDE', 'FACULTY_ADMIN') NOT NULL DEFAULT 'QR_SCAN',
    verified_by_user_id VARCHAR(64) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    verified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_att_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_reg FOREIGN KEY (registration_id) REFERENCES event_registrations(id) ON DELETE CASCADE,
    INDEX idx_att_event_student (event_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

  const springBootControllersJava = `// =======================================================================
// EVENTEASE / CAMPUSGUARD — SPRING BOOT 3 RESTFUL CONTROLLERS
// Complete Java Endpoints for Creation, Dynamic QR, Verification & PDF
// =======================================================================

package com.campusguard.controller;

import com.campusguard.dto.*;
import com.campusguard.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

/**
 * 1. Organizer Event Creation & Template Initialization Endpoint
 * 2. Dynamic QR Code Retrieval Endpoint
 */
@RestController
@RequestMapping("/api/events")
public class EventManagementController {

    @Autowired
    private EventService eventService;

    @Autowired
    private QrCodeService qrCodeService;

    // 1. Organizer creates event -> Auto initializes HOD leave template & QR secret
    @PostMapping
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<EventResponseDTO> createEvent(
            @RequestBody CreateEventRequestDTO request,
            Principal principal
    ) {
        String organizerId = principal.getName();
        EventResponseDTO createdEvent = eventService.createEventWithAutoTemplate(organizerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdEvent);
    }

    // 2. Dynamic QR Code generation for venue display
    @GetMapping("/{eventId}/qr-code")
    public ResponseEntity<QrCodeDataDTO> getEventQrCode(
            @PathVariable String eventId,
            Principal principal
    ) {
        QrCodeDataDTO qrPayload = qrCodeService.generateVenueQr(eventId);
        return ResponseEntity.ok(qrPayload);
    }
}

/**
 * 3. Student Registration & Secure QR Attendance Verification
 */
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    // Student registers for event and receives unique registration number
    @PostMapping("/register/{eventId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<RegistrationConfirmationDTO> registerStudent(
            @PathVariable String eventId,
            Principal principal
    ) {
        RegistrationConfirmationDTO reg = attendanceService.registerStudent(principal.getName(), eventId);
        return ResponseEntity.status(HttpStatus.CREATED).body(reg);
    }

    // Student scans venue QR code and submits unique registration number
    @PostMapping("/verify-qr")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<AttendanceVerificationResponseDTO> verifyAttendanceViaQr(
            @RequestBody QrAttendanceRequestDTO request,
            Principal principal
    ) {
        String studentId = principal.getName();
        AttendanceVerificationResponseDTO response = attendanceService.verifyStudentPresence(
            studentId, request.getEventId(), request.getRegistrationCode()
        );
        return ResponseEntity.ok(response);
    }
}

/**
 * 4. Leave Form Unlocking & Personalized 1-Page PDF Generation
 */
@RestController
@RequestMapping("/api/leave-forms")
public class LeaveFormController {

    @Autowired
    private LeaveApplicationPdfService pdfService;

    @Autowired
    private LeaveFormService leaveFormService;

    // Generates & downloads formal 1-page HOD clearance letter ONLY IF attendance = PRESENT
    @GetMapping("/{eventId}/download-application")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<byte[]> downloadHodLeaveApplication(
            @PathVariable String eventId,
            Principal principal
    ) {
        String studentId = principal.getName();
        
        // Verifies presence in database before unlocking document
        byte[] pdfBytes = pdfService.generateVerifiedHodLeavePdf(studentId, eventId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(
            ContentDisposition.attachment().filename("HOD_Leave_Application_" + eventId + ".pdf").build()
        );

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
`;

  const frontendWorkflowDoc = `=======================================================================
FRONTEND WORKFLOW & UI IMPLEMENTATION STEPS (REACT + TYPESCRIPT)
=======================================================================

STEP 1: ORGANIZER EVENT CREATION & AUTOMATIC TEMPLATE INITIALIZATION
-----------------------------------------------------------------------
• Component: \`src/components/OrganizerPanel.tsx\`
• Method: \`handleCreateEvent()\`
• Implementation:
  1. Organizer submits event form (title, venue, dates, category, capacity).
  2. Frontend dispatches to \`apiService.createEvent(organizerId, eventData)\`.
  3. The service auto-generates \`LeaveFormTemplate\` with pre-filled academic instructions:
     "Official EventEase HOD leave application template automatically configured for [Title]..."
  4. Generates unique cryptographic \`eventSecretCode\` for physical venue projection.
  5. Renders confirmation toast and redirects organizer to 'Manage My Events' and 'Leave Forms' tab.

STEP 2: DYNAMIC QR CODE DISPLAY AT VENUE
-----------------------------------------------------------------------
• Component: \`src/components/OrganizerPanel.tsx\` & \`AttendanceQrScannerModal.tsx\`
• Rendering: Uses \`qrcode.react\` (\`QRCodeSVG\`):
  <QRCodeSVG 
    value={JSON.stringify({ eventId: event.id, secret: event.eventSecretCode, timestamp: Date.now() })}
    size={160}
    level="H"
    includeMargin={true}
  />
• Organizer can project the live QR code on the auditorium screen or print high-res badges.

STEP 3: QR ATTENDANCE SCANNING & SUBMISSION
-----------------------------------------------------------------------
• Component: \`src/components/AttendanceQrScannerModal.tsx\`
• Workflow:
  1. Student registers for event -> Receives unique registration number (e.g. "CG-REG-7241-A").
  2. Student taps "Scan Venue QR / Check-in" on registration card or navbar.
  3. Modal displays the venue scanner view with prompt:
     "Enter Your Unique Registration Number to verify physical presence".
  4. Student submits registration ID (or clicks 1-tap "Auto-fill My Code" in test mode).
  5. Frontend dispatches to \`apiService.markAttendanceWithQr(studentId, eventId, code)\`.
  6. On match: Triggers confetti animation, marks student state as 'PRESENT', and writes audit timestamp.

STEP 4: LEAVE FORM UNLOCKING & HOD PDF DOWNLOAD
-----------------------------------------------------------------------
• Component: \`src/components/StudentLeaveForms.tsx\` & \`src/utils/pdfGenerator.ts\`
• Gatekeeper Logic:
  - If \`attendanceStatus === 'pending'\`: 
    Button is disabled with badge: "LOCKED — Must Attend Event & Scan QR Code".
  - If \`attendanceStatus === 'present'\`: 
    Button changes to vibrant emerald: "Download Leave Application (PDF) — UNLOCKED".
• Execution:
  - Calling \`downloadPersonalizedLeavePdf(student, event)\` uses jsPDF to compile a formal 1-page document:
    • University letterhead header
    • Reference Number with unique barcode tracking
    • Addressed to Head of Department (HOD)
    • Student details (Roll No, Course, Year, Department)
    • Full schedule, purpose, and signature blocks
`;

  const runInstructions = `# How to Run and Test CampusGuard / EventEase Locally

### Prerequisites
- Java 17 or Java 21 JDK
- Maven 3.8+
- MySQL 8.0+ running on port 3306
- Node.js 18+ and npm

### 1. Database Setup
1. Log into your MySQL instance:
   mysql -u root -p
2. Execute the DDL schema script:
   CREATE DATABASE IF NOT EXISTS campusguard;
   USE campusguard;
   source schema.sql;

### 2. Spring Boot Configuration (application.properties)
spring.datasource.url=jdbc:mysql://localhost:3306/campusguard?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=root
spring.jpa.hibernate.ddl-auto=update
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

### 3. Run Spring Boot Backend
mvn clean spring-boot:run

### 4. Run Frontend (React SPA / Vite)
npm install
npm run dev

### 5. Complete Acceptance Testing Workflow (cURL)
1. Organizer Creates Event (Auto-initializes HOD leave template & QR secret):
   curl -X POST http://localhost:8080/api/events \\
     -H "Content-Type: application/json" \\
     -H "Authorization: Bearer <ORGANIZER_TOKEN>" \\
     -d '{"title":"GLA National Hackathon 2026","category":"HACKATHON","venue":"Main Auditorium","maxSeats":150}'

2. Student Registers for Event & Receives Unique Pass Code:
   curl -X POST http://localhost:8080/api/attendance/register/evt-301 \\
     -H "Authorization: Bearer <STUDENT_TOKEN>"
   # Response returns: { "registrationCode": "CG-REG-8921-X", "attendanceStatus": "PENDING" }

3. Student Scans Venue QR & Validates Presence:
   curl -X POST http://localhost:8080/api/attendance/verify-qr \\
     -H "Content-Type: application/json" \\
     -H "Authorization: Bearer <STUDENT_TOKEN>" \\
     -d '{"eventId":"evt-301","registrationCode":"CG-REG-8921-X"}'
   # Response returns: { "status": "PRESENT", "leaveFormUnlocked": true }

4. Student Downloads Unlocked 1-Page Personalized HOD Leave Application PDF:
   curl -X GET -H "Authorization: Bearer <STUDENT_TOKEN>" \\
     http://localhost:8080/api/leave-forms/evt-301/download-application \\
     --output hod_leave_application.pdf
`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
            <Cpu className="w-4 h-4" />
            <span>EventEase Architecture & System Blueprint</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            EventEase Integrated Architecture & Workflow
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            End-to-end specifications covering Event Creation, Dynamic QR Generation, Secure Presence Verification, and Automated HOD Leave Form Generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Complete Architecture & Code Spec</span>
          </span>
        </div>
      </div>

      {/* Visual Workflow Steps Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-start gap-3 p-2 bg-slate-800/60 rounded-xl border border-slate-700/50">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs shrink-0">1</div>
          <div>
            <h4 className="text-xs font-bold text-white">Event Creation</h4>
            <p className="text-[11px] text-slate-300">Auto-initializes HOD leave template</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-2 bg-slate-800/60 rounded-xl border border-slate-700/50">
          <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-xs shrink-0">2</div>
          <div>
            <h4 className="text-xs font-bold text-white">Dynamic QR</h4>
            <p className="text-[11px] text-slate-300">Generated for physical venue</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-2 bg-slate-800/60 rounded-xl border border-slate-700/50">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">3</div>
          <div>
            <h4 className="text-xs font-bold text-white">QR Check-in</h4>
            <p className="text-[11px] text-slate-300">Student validates unique ID</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-2 bg-slate-800/60 rounded-xl border border-slate-700/50">
          <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center font-bold text-xs shrink-0">4</div>
          <div>
            <h4 className="text-xs font-bold text-white">Leave Form Unlocked</h4>
            <p className="text-[11px] text-slate-300">Instant 1-page HOD PDF download</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'architecture'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Architectural Logic</span>
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'schema'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>2. MySQL Schema (schema.sql)</span>
        </button>

        <button
          onClick={() => setActiveTab('controllers')}
          className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'controllers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>3. Spring Boot REST APIs</span>
        </button>

        <button
          onClick={() => setActiveTab('frontend')}
          className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'frontend'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>4. Frontend Workflow Steps</span>
        </button>

        <button
          onClick={() => setActiveTab('run')}
          className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'run'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>5. Run & Acceptance Tests</span>
        </button>
      </div>

      {/* Code Display Area */}
      <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <div className="px-5 py-3 bg-slate-950 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            <span className="text-xs font-mono text-slate-400 ml-2">
              {activeTab === 'architecture' && 'architecture/EVENT_EASE_WORKFLOW.txt'}
              {activeTab === 'schema' && 'src/main/resources/schema.sql'}
              {activeTab === 'controllers' && 'com/campusguard/controller/EventEaseControllers.java'}
              {activeTab === 'frontend' && 'docs/FRONTEND_WORKFLOW_STEPS.md'}
              {activeTab === 'run' && 'README_LOCAL_RUN.md'}
            </span>
          </div>

          <button
            onClick={() => {
              const code = activeTab === 'architecture' ? architecturalLogicDoc
                : activeTab === 'schema' ? databaseSchemaSql
                : activeTab === 'controllers' ? springBootControllersJava
                : activeTab === 'frontend' ? frontendWorkflowDoc
                : runInstructions;
              handleCopy(activeTab, code);
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            {copiedSection === activeTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        <div className="p-6 overflow-x-auto max-h-[600px] text-xs font-mono text-slate-200 leading-relaxed">
          <pre>
            {activeTab === 'architecture' && architecturalLogicDoc}
            {activeTab === 'schema' && databaseSchemaSql}
            {activeTab === 'controllers' && springBootControllersJava}
            {activeTab === 'frontend' && frontendWorkflowDoc}
            {activeTab === 'run' && runInstructions}
          </pre>
        </div>
      </div>

    </div>
  );
};

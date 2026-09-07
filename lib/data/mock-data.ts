import { Profile, Course, Chapter, Lecture, Note, Enrollment, LectureProgress, ShortVideo, AppNotification } from '@/types/database'

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'user-student-1',
    full_name: 'Alex Johnson',
    email: 'student@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'student',
    bio: 'Computer Science enthusiast & aspiring Fullstack Engineer.',
    created_at: '2026-01-10T09:00:00Z'
  },
  {
    id: 'user-teacher-1',
    full_name: 'Prof. Ramesh Sharma',
    email: 'teacher@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'teacher',
    teacher_status: 'approved',
    bio: 'Senior Software Architect and Computer Science Educator with 15+ years experience.',
    created_at: '2025-11-15T10:00:00Z'
  },
  {
    id: 'user-teacher-2',
    full_name: 'Dr. Emily Watson',
    email: 'emily.physics@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    role: 'teacher',
    teacher_status: 'approved',
    bio: 'PhD in Theoretical Physics. Passionate about simplifying complex science concepts.',
    created_at: '2025-12-01T11:00:00Z'
  },
  {
    id: 'user-teacher-3',
    full_name: 'David Miller',
    email: 'david.chem@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'teacher',
    teacher_status: 'pending',
    bio: 'Organic Chemistry specialist & competitive exam trainer.',
    created_at: '2026-02-01T08:30:00Z'
  },
  {
    id: 'user-admin-1',
    full_name: 'Platform Administrator',
    email: 'admin@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    bio: 'Platform System Administrator and Curriculum Director.',
    created_at: '2025-01-01T00:00:00Z'
  }
]

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-java-101',
    teacher_id: 'user-teacher-1',
    title: 'Java Programming Complete Masterclass',
    description: 'Master Java from core object-oriented principles, multithreading, and collections to advanced software architecture and JVM internals.',
    thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    category: 'Programming',
    status: 'published',
    price: 0,
    created_at: '2026-01-05T10:00:00Z',
    updated_at: '2026-02-15T14:30:00Z'
  },
  {
    id: 'course-physics-12',
    teacher_id: 'user-teacher-2',
    title: 'Physics Class 12 & JEE: Electromagnetism & Optics',
    description: 'Comprehensive physics lectures covering Electrostatics, Current Electricity, Magnetism, Electromagnetic Induction, and Wave Optics.',
    thumbnail_url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&auto=format&fit=crop&q=80',
    category: 'Physics',
    status: 'published',
    price: 0,
    created_at: '2026-01-12T11:00:00Z',
    updated_at: '2026-02-20T16:00:00Z'
  },
  {
    id: 'course-chemistry-neet',
    teacher_id: 'user-teacher-1',
    title: 'Organic Chemistry: Reactions & Mechanisms for NEET',
    description: 'In-depth breakdown of Reaction Mechanisms, Hydrocarbons, Biomolecules, and Named Reactions designed for competitive excellence.',
    thumbnail_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
    category: 'Chemistry',
    status: 'published',
    price: 0,
    created_at: '2026-01-20T08:00:00Z',
    updated_at: '2026-02-25T12:00:00Z'
  },
  {
    id: 'course-nextjs-fullstack',
    teacher_id: 'user-teacher-1',
    title: 'Fullstack Next.js 16 & Supabase Architecture',
    description: 'Build enterprise-grade modern web applications with Server Components, Actions, Supabase RLS, and Tailwind CSS.',
    thumbnail_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    category: 'Programming',
    status: 'published',
    price: 0,
    created_at: '2026-02-01T09:00:00Z',
    updated_at: '2026-02-28T10:00:00Z'
  },
  {
    id: 'course-draft-math',
    teacher_id: 'user-teacher-1',
    title: 'Higher Mathematics & Differential Calculus',
    description: 'Comprehensive course on Limits, Continuity, Derivatives, and Applications of Integrals.',
    thumbnail_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
    category: 'Mathematics',
    status: 'draft',
    price: 0,
    created_at: '2026-02-18T14:00:00Z',
    updated_at: '2026-02-18T14:00:00Z'
  }
]

export const INITIAL_CHAPTERS: Chapter[] = [
  // Java Course Chapters
  {
    id: 'chap-java-1',
    course_id: 'course-java-101',
    title: 'Chapter 1 — Introduction to Java & Environment Setup',
    description: 'Understanding the JVM, JRE, JDK, bytecode compilation, and setting up your IDE.',
    chapter_order: 1,
    created_at: '2026-01-05T10:30:00Z'
  },
  {
    id: 'chap-java-2',
    course_id: 'course-java-101',
    title: 'Chapter 2 — Variables, Data Types & Control Structures',
    description: 'Primitive and reference types, operators, conditionals, and loops.',
    chapter_order: 2,
    created_at: '2026-01-05T11:00:00Z'
  },
  {
    id: 'chap-java-3',
    course_id: 'course-java-101',
    title: 'Chapter 3 — Object Oriented Programming (OOP)',
    description: 'Classes, Objects, Constructors, Memory Heap vs Stack, Encapsulation.',
    chapter_order: 3,
    created_at: '2026-01-05T11:30:00Z'
  },
  {
    id: 'chap-java-4',
    course_id: 'course-java-101',
    title: 'Chapter 4 — Inheritance & Polymorphism',
    description: 'Super keyword, method overriding, abstract classes, interfaces and dynamic binding.',
    chapter_order: 4,
    created_at: '2026-01-05T12:00:00Z'
  },
  // Physics Course Chapters
  {
    id: 'chap-phys-1',
    course_id: 'course-physics-12',
    title: 'Chapter 1 — Electrostatics & Gauss Law',
    description: 'Coulombs law, Electric fields, Electric dipoles, Flux, and Gauss Law applications.',
    chapter_order: 1,
    created_at: '2026-01-12T11:30:00Z'
  },
  {
    id: 'chap-phys-2',
    course_id: 'course-physics-12',
    title: 'Chapter 2 — Current Electricity & Circuits',
    description: 'Drift velocity, Ohms law, Kirchhoffs rules, Wheatstone Bridge, and Potentiometer.',
    chapter_order: 2,
    created_at: '2026-01-12T12:00:00Z'
  },
  // Chemistry Chapters
  {
    id: 'chap-chem-1',
    course_id: 'course-chemistry-neet',
    title: 'Chapter 1 — General Organic Chemistry (GOC)',
    description: 'Inductive effect, Electromeric effect, Resonance, Hyperconjugation and Aromaticity.',
    chapter_order: 1,
    created_at: '2026-01-20T08:30:00Z'
  },
  // Next.js Chapters
  {
    id: 'chap-next-1',
    course_id: 'course-nextjs-fullstack',
    title: 'Chapter 1 — Next.js 16 App Router Fundamentals',
    description: 'Server Components, Client Components, Dynamic Routing and Layout nesting.',
    chapter_order: 1,
    created_at: '2026-02-01T09:30:00Z'
  }
]

export const INITIAL_LECTURES: Lecture[] = [
  // Java Lectures - Chapter 1
  {
    id: 'lec-java-101',
    chapter_id: 'chap-java-1',
    title: 'Lecture 01: Introduction to Java Ecosystem & Architecture',
    description: 'In this lecture, we explore how Java achieves platform independence via the JVM, the role of bytecode, and writing our first Hello World program.',
    video_path: '/videos/sample-short-1.mp4',
    duration: 720, // 12 mins
    lecture_order: 1,
    is_published: true,
    is_free_preview: true,
    created_at: '2026-01-06T09:00:00Z'
  },
  {
    id: 'lec-java-102',
    chapter_id: 'chap-java-1',
    title: 'Lecture 02: Setting Up JDK, IntelliJ & VS Code',
    description: 'Step-by-step setup of the Java Development Kit (JDK 21), configuring environment variables (JAVA_HOME), and preparing modern developer tools.',
    video_path: '/videos/sample-short-2.mp4',
    duration: 940,
    lecture_order: 2,
    is_published: true,
    is_free_preview: true,
    created_at: '2026-01-06T10:30:00Z'
  },
  // Java Lectures - Chapter 2
  {
    id: 'lec-java-201',
    chapter_id: 'chap-java-2',
    title: 'Lecture 03: Primitive Data Types, Memory Allocation & Type Casting',
    description: 'Deep dive into byte, short, int, long, float, double, char, and boolean. Implicit widening versus explicit narrowing type conversions.',
    video_path: '/videos/sample-short-1.mp4',
    duration: 1120,
    lecture_order: 1,
    is_published: true,
    is_free_preview: false,
    created_at: '2026-01-07T09:00:00Z'
  },
  {
    id: 'lec-java-202',
    chapter_id: 'chap-java-2',
    title: 'Lecture 04: Control Flow: Switch Expressions & Pattern Matching',
    description: 'Modern switch statements, if-else branches, break/continue semantics, and enhanced for loops in Java.',
    video_path: '/videos/sample-short-2.mp4',
    duration: 1350,
    lecture_order: 2,
    is_published: true,
    is_free_preview: false,
    created_at: '2026-01-07T11:00:00Z'
  },
  // Java Lectures - Chapter 3
  {
    id: 'lec-java-301',
    chapter_id: 'chap-java-3',
    title: 'Lecture 05: Classes, Objects & Memory Anatomy (Heap vs Stack)',
    description: 'How objects are instantiated in JVM Heap memory, reference pointers in Stack frames, and default vs parameterized constructors.',
    video_path: '/videos/sample-short-3.mp4',
    duration: 1480,
    lecture_order: 1,
    is_published: true,
    is_free_preview: false,
    created_at: '2026-01-08T09:00:00Z'
  },
  {
    id: 'lec-java-302',
    chapter_id: 'chap-java-3',
    title: 'Lecture 06: Encapsulation, Access Modifiers & Records',
    description: 'Private, protected, public, and package-private scopes. Java records for immutable data transfer objects.',
    video_path: '/videos/sample-short-4.mp4',
    duration: 1200,
    lecture_order: 2,
    is_published: true,
    is_free_preview: false,
    created_at: '2026-01-08T11:30:00Z'
  },
  // Java Lectures - Chapter 4
  {
    id: 'lec-java-401',
    chapter_id: 'chap-java-4',
    title: 'Lecture 07: Inheritance, Super Keyword & Method Overriding',
    description: 'Class hierarchies, code reuse, constructor chaining with super(), and overriding methods safely with @Override.',
    video_path: '/videos/sample-short-2.mp4',
    duration: 1540,
    lecture_order: 1,
    is_published: true,
    is_free_preview: false,
    created_at: '2026-01-09T09:00:00Z'
  },
  {
    id: 'lec-java-402',
    chapter_id: 'chap-java-4',
    title: 'Lecture 08: Polymorphism, Interfaces & Sealed Classes',
    description: 'Dynamic method dispatch, interface default & static methods, multiple interface implementation, and sealed classes.',
    video_path: '/videos/sample-short-3.mp4',
    duration: 1620,
    lecture_order: 2,
    is_published: true,
    is_free_preview: false,
    created_at: '2026-01-09T11:00:00Z'
  },
  // Physics Lectures
  {
    id: 'lec-phys-101',
    chapter_id: 'chap-phys-1',
    title: 'Lecture 01: Electric Charges, Quantization & Coulombs Law',
    description: 'Fundamental electric properties, force vectors between point charges, dielectric constants and superposition principle.',
    video_path: '/videos/sample-short-4.mp4',
    duration: 1800,
    lecture_order: 1,
    is_published: true,
    is_free_preview: true,
    created_at: '2026-01-13T10:00:00Z'
  },
  {
    id: 'lec-phys-102',
    chapter_id: 'chap-phys-1',
    title: 'Lecture 02: Electric Field Lines & Gauss Theorem Applications',
    description: 'Flux calculations, Gaussian surfaces for infinite line charge, charged plane sheet, and spherical conducting shells.',
    video_path: '/videos/sample-short-2.mp4',
    duration: 2100,
    lecture_order: 2,
    is_published: true,
    is_free_preview: false,
    created_at: '2026-01-14T10:00:00Z'
  },
  // Chemistry Lectures
  {
    id: 'lec-chem-101',
    chapter_id: 'chap-chem-1',
    title: 'Lecture 01: Electronic Displacement Effects in Organic Molecules',
    description: 'Mastering Inductive, Mesomeric, and Hyperconjugative stabilization effects with solved problems.',
    video_path: '/videos/sample-short-1.mp4',
    duration: 1950,
    lecture_order: 1,
    is_published: true,
    is_free_preview: true,
    created_at: '2026-01-21T09:00:00Z'
  },
  // Next.js Lectures
  {
    id: 'lec-next-101',
    chapter_id: 'chap-next-1',
    title: 'Lecture 01: Next.js 16 Server Components & App Architecture',
    description: 'Understanding Server vs Client Component boundaries, data caching layers, streaming with Suspense, and Turbopack.',
    video_path: '/videos/sample-short-1.mp4',
    duration: 1400,
    lecture_order: 1,
    is_published: true,
    is_free_preview: true,
    created_at: '2026-02-02T10:00:00Z'
  }
]

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note-java-1',
    lecture_id: 'lec-java-101',
    title: 'Java Architecture & Bytecode Cheatsheet (PDF)',
    file_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'application/pdf',
    created_at: '2026-01-06T09:30:00Z'
  },
  {
    id: 'note-java-2',
    lecture_id: 'lec-java-102',
    title: 'IDE Configuration & Shortcut Reference Guide',
    file_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'application/pdf',
    created_at: '2026-01-06T11:00:00Z'
  },
  {
    id: 'note-java-3',
    lecture_id: 'lec-java-301',
    title: 'JVM Memory Model: Heap vs Stack Diagram Notes',
    file_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'application/pdf',
    created_at: '2026-01-08T10:00:00Z'
  },
  {
    id: 'note-phys-1',
    lecture_id: 'lec-phys-101',
    title: 'Electrostatics Formulas & Solved JEE Problems',
    file_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'application/pdf',
    created_at: '2026-01-13T10:30:00Z'
  },
  {
    id: 'note-chem-1',
    lecture_id: 'lec-chem-101',
    title: 'Reaction Mechanisms Mindmap & Acidity Order Charts',
    file_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'application/pdf',
    created_at: '2026-01-21T09:30:00Z'
  }
]

export const INITIAL_ENROLLMENTS: Enrollment[] = [
  {
    id: 'enr-1',
    student_id: 'user-student-1',
    course_id: 'course-java-101',
    enrolled_at: '2026-01-15T10:00:00Z'
  },
  {
    id: 'enr-2',
    student_id: 'user-student-1',
    course_id: 'course-physics-12',
    enrolled_at: '2026-01-18T14:00:00Z'
  }
]

export const INITIAL_PROGRESS: LectureProgress[] = [
  {
    id: 'prog-1',
    student_id: 'user-student-1',
    lecture_id: 'lec-java-101',
    watched_seconds: 720,
    completed: true,
    last_watched_at: '2026-02-10T11:00:00Z'
  },
  {
    id: 'prog-2',
    student_id: 'user-student-1',
    lecture_id: 'lec-java-102',
    watched_seconds: 940,
    completed: true,
    last_watched_at: '2026-02-12T15:30:00Z'
  },
  {
    id: 'prog-3',
    student_id: 'user-student-1',
    lecture_id: 'lec-java-201',
    watched_seconds: 450,
    completed: false,
    last_watched_at: '2026-02-27T08:20:00Z'
  },
  {
    id: 'prog-4',
    student_id: 'user-student-1',
    lecture_id: 'lec-phys-101',
    watched_seconds: 900,
    completed: false,
    last_watched_at: '2026-02-28T16:00:00Z'
  }
]

export const INITIAL_SHORTS: ShortVideo[] = [
  {
    id: 'short-1',
    title: '⚡ Java Heap vs Stack Memory in 45 Seconds!',
    description: 'Understand how references live on the Stack while dynamic objects reside in Heap memory. Essential for Java & backend interviews!',
    video_url: '/videos/sample-short-1.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    duration: 45,
    teacher_id: 'user-teacher-1',
    course_id: 'course-java-101',
    course_title: 'Java Programming Complete Masterclass',
    views_count: 14200,
    likes_count: 852,
    is_liked: false,
    is_saved: false,
    tags: ['Java', 'Programming', 'Memory', 'Interview'],
    created_at: '2026-02-15T10:00:00Z',
    comments: [
      {
        id: 'comm-1-1',
        short_id: 'short-1',
        user_id: 'user-student-1',
        user_name: 'Alex Johnson',
        user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        content: 'Finally understood Garbage Collection triggers after this quick breakdown! 🔥',
        created_at: '2026-02-16T12:00:00Z',
        likes_count: 24
      },
      {
        id: 'comm-1-2',
        short_id: 'short-1',
        user_id: 'user-teacher-2',
        user_name: 'Dr. Emily Watson',
        user_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        content: 'Brilliant visualization Ramesh! Highly recommended for all freshmen.',
        created_at: '2026-02-17T09:30:00Z',
        likes_count: 11
      }
    ]
  },
  {
    id: 'short-2',
    title: '🧲 Right-Hand Thumb Rule & Magnetic Field Lines Visualized',
    description: 'Point your thumb along the current vector, curl your fingers — see the concentric magnetic flux lines generated in 3D!',
    video_url: '/videos/sample-short-2.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&auto=format&fit=crop&q=80',
    duration: 52,
    teacher_id: 'user-teacher-2',
    course_id: 'course-physics-12',
    course_title: 'Class 12 Advanced Physics',
    views_count: 9840,
    likes_count: 614,
    is_liked: true,
    is_saved: true,
    tags: ['Physics', 'Electromagnetism', 'Class12', 'Science'],
    created_at: '2026-02-18T14:20:00Z',
    comments: [
      {
        id: 'comm-2-1',
        short_id: 'short-2',
        user_id: 'user-student-1',
        user_name: 'Alex Johnson',
        user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        content: 'Saved for my board revision! Thank you Dr. Watson 👏',
        created_at: '2026-02-19T08:15:00Z',
        likes_count: 19
      }
    ]
  },
  {
    id: 'short-3',
    title: '🧪 SN2 Inversion (Walden Inversion) Explained in 40s!',
    description: 'Backside attack by the nucleophile flips the tetrahedral carbon like an umbrella in a storm! One-step bimolecular kinetics.',
    video_url: '/videos/sample-short-3.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&auto=format&fit=crop&q=80',
    duration: 38,
    teacher_id: 'user-teacher-3',
    course_id: 'course-chemistry-neet',
    course_title: 'Organic Chemistry for NEET & JEE',
    views_count: 18500,
    likes_count: 1240,
    is_liked: false,
    is_saved: false,
    tags: ['Chemistry', 'OrganicChemistry', 'NEET', 'JEE'],
    created_at: '2026-02-20T11:00:00Z',
    comments: [
      {
        id: 'comm-3-1',
        short_id: 'short-3',
        user_id: 'user-student-1',
        user_name: 'Alex Johnson',
        user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        content: 'The umbrella analogy is unforgettable!',
        created_at: '2026-02-21T16:40:00Z',
        likes_count: 32
      }
    ]
  },
  {
    id: 'short-4',
    title: '🚀 Next.js 16 Server Actions Demystified in 50 Seconds',
    description: 'No API routes needed! Mark an async function with use server and mutate data straight from your form or client components.',
    video_url: '/videos/sample-short-4.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    duration: 49,
    teacher_id: 'user-teacher-1',
    course_id: 'course-nextjs-fullstack',
    course_title: 'Fullstack Next.js 16 & Supabase Masterclass',
    views_count: 22100,
    likes_count: 1890,
    is_liked: true,
    is_saved: false,
    tags: ['Nextjs', 'React', 'WebDev', 'Fullstack'],
    created_at: '2026-02-22T15:00:00Z',
    comments: [
      {
        id: 'comm-4-1',
        short_id: 'short-4',
        user_id: 'user-student-1',
        user_name: 'Alex Johnson',
        user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        content: 'Next.js 16 is insane, great breakdown Prof. Ramesh!',
        created_at: '2026-02-23T10:10:00Z',
        likes_count: 45
      }
    ]
  },
  {
    id: 'short-5',
    title: "⚡ Lenz's Law: Why Induced Current Opposes the Change",
    description: 'Nature loves conservation of energy! Drop a magnet down a copper tube and watch eddy currents slow it down in real-time.',
    video_url: '/videos/sample-short-2.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&auto=format&fit=crop&q=80',
    duration: 42,
    teacher_id: 'user-teacher-2',
    course_id: 'course-physics-12',
    course_title: 'Class 12 Advanced Physics',
    views_count: 8100,
    likes_count: 540,
    is_liked: false,
    is_saved: false,
    tags: ['Physics', 'Electromagnetism', 'Experiments', 'Science'],
    created_at: '2026-02-23T16:00:00Z',
    comments: []
  },
  {
    id: 'short-6',
    title: '💡 3 VS Code Shortcuts Every Developer Must Use Daily',
    description: 'Multi-cursor editing, quick symbol search, and smart bracket matching. Boost your coding speed 2x today!',
    video_url: '/videos/sample-short-1.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&auto=format&fit=crop&q=80',
    duration: 35,
    teacher_id: 'user-teacher-1',
    course_id: 'course-java-101',
    course_title: 'Java Programming Complete Masterclass',
    views_count: 15700,
    likes_count: 1040,
    is_liked: false,
    is_saved: true,
    tags: ['Productivity', 'VSCode', 'CodingTips', 'DevTips'],
    created_at: '2026-02-24T09:00:00Z',
    comments: []
  }
]

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    user_id: null,
    target_audience: 'all',
    title: '🚀 Spring 2026 Platform Upgrade Live',
    message: 'We have enabled ultra-fast micro-lessons in Shorts Studio and interactive course playlists!',
    type: 'announcement',
    priority: 'info',
    link_url: '/shorts',
    link_label: 'Explore Shorts',
    sender_id: 'user-admin-1',
    sender_name: 'Platform Administrator',
    sender_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    is_read: false,
    created_at: '2026-03-05T10:30:00Z'
  },
  {
    id: 'notif-2',
    user_id: 'user-student-1',
    target_audience: 'students',
    title: '🔥 New Short: Java Memory Stack vs Heap',
    message: 'Prof. Ramesh Sharma published a new 45s lesson on stack allocation and garbage collection.',
    type: 'shorts',
    priority: 'info',
    link_url: '/shorts',
    link_label: 'Watch Now',
    sender_id: 'user-teacher-1',
    sender_name: 'Prof. Ramesh Sharma',
    sender_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    is_read: false,
    created_at: '2026-03-06T14:15:00Z'
  },
  {
    id: 'notif-3',
    user_id: 'user-student-1',
    target_audience: 'students',
    title: '🏆 Achievement Unlocked: Architecture Master',
    message: 'Congratulations! You scored 100% on the Java Architecture assessment quiz.',
    type: 'achievement',
    priority: 'success',
    link_url: '/student/my-courses',
    link_label: 'View Certificate',
    is_read: false,
    created_at: '2026-03-06T16:00:00Z'
  },
  {
    id: 'notif-4',
    user_id: 'user-teacher-1',
    target_audience: 'teachers',
    title: '🎓 12 New Students Enrolled',
    message: 'Your course "Java Programming Complete Masterclass" has 12 new active enrollments this week.',
    type: 'enrollment',
    priority: 'success',
    link_url: '/teacher/students',
    link_label: 'View Students',
    is_read: false,
    created_at: '2026-03-05T12:00:00Z'
  },
  {
    id: 'notif-5',
    user_id: 'user-admin-1',
    target_audience: 'admins',
    title: '📋 Teacher Approval Pending',
    message: 'David Miller submitted credentials for Organic Chemistry. Review verification documents.',
    type: 'teacher_approval',
    priority: 'warning',
    link_url: '/admin/teachers',
    link_label: 'Review Candidate',
    sender_name: 'Verification Bot',
    is_read: false,
    created_at: '2026-03-06T09:30:00Z'
  },
  {
    id: 'notif-6',
    user_id: null,
    target_audience: 'all',
    title: '⚙️ Scheduled Maintenance Notice',
    message: 'Database optimization is scheduled for Sunday at 02:00 AM UTC. Estimated downtime: 10 minutes.',
    type: 'system',
    priority: 'warning',
    link_url: '/admin',
    link_label: 'System Status',
    sender_name: 'DevOps System',
    is_read: true,
    read_at: '2026-03-04T18:00:00Z',
    created_at: '2026-03-04T12:00:00Z'
  }
]


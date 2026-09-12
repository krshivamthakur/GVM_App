import { 
  Profile, 
  Course, 
  Chapter, 
  Lecture, 
  Note, 
  Enrollment, 
  LectureProgress, 
  CourseWithCurriculum, 
  ChapterWithLectures,
  UserRole,
  ShortVideo,
  ShortComment,
  AppNotification,
  NotificationPreferences,
  AdminNotificationStats
} from '@/types/database'
import {
  INITIAL_PROFILES,
  INITIAL_COURSES,
  INITIAL_CHAPTERS,
  INITIAL_LECTURES,
  INITIAL_NOTES,
  INITIAL_ENROLLMENTS,
  INITIAL_PROGRESS,
  INITIAL_SHORTS,
  INITIAL_NOTIFICATIONS
} from './mock-data'

// Persistent In-Memory Data store
let profiles: Profile[] = [...INITIAL_PROFILES]
let courses: Course[] = [...INITIAL_COURSES]
let chapters: Chapter[] = [...INITIAL_CHAPTERS]
let lectures: Lecture[] = [...INITIAL_LECTURES]
let notes: Note[] = [...INITIAL_NOTES]
let enrollments: Enrollment[] = [...INITIAL_ENROLLMENTS]
let progressList: LectureProgress[] = [...INITIAL_PROGRESS]
let shorts: ShortVideo[] = [...INITIAL_SHORTS]
let notifications: AppNotification[] = [...INITIAL_NOTIFICATIONS]
let userReadNotifications: Record<string, string[]> = {}
let notificationPreferences: Record<string, NotificationPreferences> = {}
// Anonymous placeholder — replaced immediately after login via dataStore.setActiveUser()
const ANONYMOUS_PROFILE: Profile = {
  id: '',
  full_name: '',
  email: '',
  avatar_url: '',
  role: 'student',
  teacher_status: 'approved',
  created_at: new Date().toISOString()
}
let activeUser: Profile = ANONYMOUS_PROFILE


export const dataStore = {
  // USER & AUTH
  getActiveUser(): Profile {
    return activeUser
  },
  setActiveUser(user: Profile) {
    activeUser = user
  },
  setActiveRole(role: UserRole) {
    const found = profiles.find((p) => p.role === role)
    if (found) {
      activeUser = found
    }
  },
  getProfiles(): Profile[] {
    if (activeUser.role === 'student') {
      return [activeUser]
    }
    return [...profiles]
  },
  getAllProfilesAdmin(): Profile[] {
    return [...profiles]
  },
  deleteProfileAdmin(id: string): boolean {
    const initial = profiles.length
    profiles = profiles.filter((p) => p.id !== id)
    return profiles.length < initial
  },
  updateProfileAdmin(id: string, updates: Partial<Profile>): Profile | undefined {
    const idx = profiles.findIndex((p) => p.id === id)
    if (idx !== -1) {
      profiles[idx] = { ...profiles[idx], ...updates }
      if (activeUser.id === id) {
        activeUser = profiles[idx]
      }
      return profiles[idx]
    }
    return undefined
  },
  getProfileById(id: string): Profile | undefined {
    const p = profiles.find((prof) => prof.id === id)
    if (!p) return undefined
    // For students viewing instructors (e.g. course instructor card), keep public info
    if (activeUser.role === 'student' && activeUser.id !== id && p.role === 'student') {
      return undefined // Never expose other students' profiles
    }
    return p
  },
  updateProfile(id: string, updates: Partial<Profile>): Profile | undefined {
    // Students can NEVER update any profile other than their own
    if (activeUser.role === 'student' && activeUser.id !== id) {
      return undefined
    }
    const idx = profiles.findIndex((p) => p.id === id)
    if (idx !== -1) {
      profiles[idx] = { ...profiles[idx], ...updates }
      if (activeUser.id === id) {
        activeUser = profiles[idx]
      }
      return profiles[idx]
    }
    return undefined
  },
  approveTeacher(teacherId: string, status: 'approved' | 'rejected'): Profile | undefined {
    if (activeUser.role !== 'admin') {
      return undefined
    }
    return this.updateProfile(teacherId, { teacher_status: status })
  },

  // COURSES
  getAllCourses(): Course[] {
    return [...courses].map((c) => ({
      ...c,
      teacher: this.getProfileById(c.teacher_id),
      _count: {
        enrollments: enrollments.filter((e) => e.course_id === c.id).length,
        lectures: chapters
          .filter((ch) => ch.course_id === c.id)
          .flatMap((ch) => lectures.filter((l) => l.chapter_id === ch.id)).length
      }
    }))
  },
  getPublishedCourses(category?: string, search?: string): Course[] {
    let result = this.getAllCourses().filter((c) => c.status === 'published')
    if (category && category !== 'All') {
      result = result.filter((c) => c.category?.toLowerCase() === category.toLowerCase())
    }
    if (search && search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q)
      )
    }
    return result
  },
  getCoursesByTeacher(teacherId: string): Course[] {
    return this.getAllCourses().filter((c) => c.teacher_id === teacherId)
  },
  getCourseById(courseId: string, studentId?: string): CourseWithCurriculum | null {
    const course = courses.find((c) => c.id === courseId)
    if (!course) return null

    const teacher = this.getProfileById(course.teacher_id) || {
      id: course.teacher_id,
      full_name: 'Instructor',
      email: 'instructor@example.com',
      avatar_url: null,
      role: 'teacher' as const,
      created_at: new Date().toISOString()
    }

    const courseChapters = chapters
      .filter((ch) => ch.course_id === courseId)
      .sort((a, b) => a.chapter_order - b.chapter_order)

    const chaptersWithLectures: ChapterWithLectures[] = courseChapters.map((ch) => {
      const chLectures = lectures
        .filter((l) => l.chapter_id === ch.id)
        .sort((a, b) => a.lecture_order - b.lecture_order)
        .map((lec) => {
          const lecNotes = notes.filter((n) => n.lecture_id === lec.id)
          const prog = studentId
            ? progressList.find((p) => p.student_id === studentId && p.lecture_id === lec.id)
            : undefined
          return {
            ...lec,
            notes: lecNotes,
            progress: prog
          }
        })

      return {
        ...ch,
        lectures: chLectures
      }
    })

    const allLectures = chaptersWithLectures.flatMap((ch) => ch.lectures)
    const completedLectures = allLectures.filter((l) => l.progress?.completed).length
    const totalLectures = allLectures.length
    const progressPercentage =
      totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0

    const isEnrolled = studentId
      ? enrollments.some((e) => e.student_id === studentId && e.course_id === courseId)
      : false

    if (activeUser.role === 'student' && course.status !== 'published' && !isEnrolled) {
      return null
    }

    return {
      ...course,
      teacher,
      chapters: chaptersWithLectures,
      is_enrolled: isEnrolled,
      progress_percentage: progressPercentage,
      completed_lectures_count: completedLectures,
      total_lectures_count: totalLectures,
      _count: {
        enrollments: enrollments.filter((e) => e.course_id === course.id).length,
        lectures: totalLectures
      }
    }
  },
  createCourse(courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Course {
    if (activeUser.role === 'student') {
      throw new Error('Unauthorized: Students cannot create courses')
    }
    const newCourse: Course = {
      ...courseData,
      id: `course-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    courses.unshift(newCourse)
    return newCourse
  },
  updateCourse(courseId: string, updates: Partial<Course>): Course | null {
    if (activeUser.role === 'student') return null
    const idx = courses.findIndex((c) => c.id === courseId)
    if (idx === -1) return null
    courses[idx] = {
      ...courses[idx],
      ...updates,
      updated_at: new Date().toISOString()
    }
    return courses[idx]
  },
  deleteCourse(courseId: string): boolean {
    if (activeUser.role === 'student') return false
    const initialLen = courses.length
    courses = courses.filter((c) => c.id !== courseId)
    // Cascade delete chapters, lectures, enrollments
    const chs = chapters.filter((ch) => ch.course_id === courseId)
    const chIds = chs.map((c) => c.id)
    chapters = chapters.filter((ch) => ch.course_id !== courseId)
    lectures = lectures.filter((l) => !chIds.includes(l.chapter_id))
    enrollments = enrollments.filter((e) => e.course_id !== courseId)
    return courses.length < initialLen
  },

  // CHAPTERS
  createChapter(chapterData: Omit<Chapter, 'id' | 'created_at'>): Chapter {
    if (activeUser.role === 'student') {
      throw new Error('Unauthorized: Students cannot create chapters')
    }
    const newChapter: Chapter = {
      ...chapterData,
      id: `chap-${Date.now()}`,
      created_at: new Date().toISOString()
    }
    chapters.push(newChapter)
    return newChapter
  },
  updateChapter(chapterId: string, updates: Partial<Chapter>): Chapter | null {
    if (activeUser.role === 'student') return null
    const idx = chapters.findIndex((ch) => ch.id === chapterId)
    if (idx === -1) return null
    chapters[idx] = { ...chapters[idx], ...updates }
    return chapters[idx]
  },
  deleteChapter(chapterId: string): boolean {
    if (activeUser.role === 'student') return false
    const initialLen = chapters.length
    chapters = chapters.filter((ch) => ch.id !== chapterId)
    lectures = lectures.filter((l) => l.chapter_id !== chapterId)
    return chapters.length < initialLen
  },

  // LECTURES
  createLecture(lectureData: Omit<Lecture, 'id' | 'created_at'>): Lecture {
    if (activeUser.role === 'student') {
      throw new Error('Unauthorized: Students cannot create lectures')
    }
    const newLecture: Lecture = {
      ...lectureData,
      id: `lec-${Date.now()}`,
      created_at: new Date().toISOString()
    }
    lectures.push(newLecture)
    return newLecture
  },
  updateLecture(lectureId: string, updates: Partial<Lecture>): Lecture | null {
    if (activeUser.role === 'student') return null
    const idx = lectures.findIndex((l) => l.id === lectureId)
    if (idx === -1) return null
    lectures[idx] = { ...lectures[idx], ...updates }
    return lectures[idx]
  },
  deleteLecture(lectureId: string): boolean {
    if (activeUser.role === 'student') return false
    const initialLen = lectures.length
    lectures = lectures.filter((l) => l.id !== lectureId)
    notes = notes.filter((n) => n.lecture_id !== lectureId)
    progressList = progressList.filter((p) => p.lecture_id !== lectureId)
    return lectures.length < initialLen
  },
  getLectureDetails(lectureId: string, studentId?: string) {
    const lecture = lectures.find((l) => l.id === lectureId)
    if (!lecture) return null
    const chapter = chapters.find((ch) => ch.id === lecture.chapter_id)
    if (!chapter) return null
    const course = courses.find((c) => c.id === chapter.course_id)
    if (!course) return null

    const isEnrolled = studentId
      ? enrollments.some((e) => e.student_id === studentId && e.course_id === course.id)
      : false

    if (activeUser.role === 'student') {
      if (course.status !== 'published' && !isEnrolled) return null
      if (!lecture.is_published) return null
    }

    const lecNotes = notes.filter((n) => n.lecture_id === lecture.id)
    const targetStudentId = activeUser.role === 'student' ? activeUser.id : studentId
    const prog = targetStudentId
      ? progressList.find((p) => p.student_id === targetStudentId && p.lecture_id === lecture.id)
      : undefined

    // Find previous and next lectures in this course
    const courseCurriculum = this.getCourseById(course.id, targetStudentId)
    const allLecs = courseCurriculum?.chapters.flatMap((ch) => ch.lectures) || []
    const currentIndex = allLecs.findIndex((l) => l.id === lecture.id)

    const prevLecture = currentIndex > 0 ? allLecs[currentIndex - 1] : null
    const nextLecture = currentIndex < allLecs.length - 1 ? allLecs[currentIndex + 1] : null

    return {
      lecture: { ...lecture, notes: lecNotes, progress: prog },
      chapter,
      course,
      prevLectureId: prevLecture?.id || null,
      nextLectureId: nextLecture?.id || null
    }
  },

  // NOTES
  createNote(noteData: Omit<Note, 'id' | 'created_at'>): Note {
    const newNote: Note = {
      ...noteData,
      id: `note-${Date.now()}`,
      created_at: new Date().toISOString()
    }
    notes.push(newNote)
    return newNote
  },
  deleteNote(noteId: string): boolean {
    if (activeUser.role === 'student') return false
    const initialLen = notes.length
    notes = notes.filter((n) => n.id !== noteId)
    return notes.length < initialLen
  },

  // ENROLLMENTS
  enrollStudent(studentId: string, courseId: string): Enrollment {
    const targetId = activeUser.role === 'student' ? activeUser.id : studentId
    const existing = enrollments.find((e) => e.student_id === targetId && e.course_id === courseId)
    if (existing) return existing

    const newEnrollment: Enrollment = {
      id: `enr-${Date.now()}`,
      student_id: targetId,
      course_id: courseId,
      enrolled_at: new Date().toISOString()
    }
    enrollments.push(newEnrollment)
    return newEnrollment
  },
  unenrollStudent(studentId: string, courseId: string): boolean {
    const targetId = activeUser.role === 'student' ? activeUser.id : studentId
    const len = enrollments.length
    enrollments = enrollments.filter((e) => !(e.student_id === targetId && e.course_id === courseId))
    return enrollments.length < len
  },
  getStudentEnrollments(studentId: string): CourseWithCurriculum[] {
    const targetId = activeUser.role === 'student' ? activeUser.id : studentId
    const enrolledCourseIds = enrollments
      .filter((e) => e.student_id === targetId)
      .map((e) => e.course_id)

    return enrolledCourseIds
      .map((id) => this.getCourseById(id, targetId))
      .filter((c): c is CourseWithCurriculum => c !== null)
  },
  getEnrolledStudentsForTeacher(teacherId: string) {
    if (activeUser.role === 'student') return []
    const teacherCourseIds = courses.filter((c) => c.teacher_id === teacherId).map((c) => c.id)
    const teacherEnrollments = enrollments.filter((e) => teacherCourseIds.includes(e.course_id))

    return teacherEnrollments.map((enr) => {
      const student = this.getProfileById(enr.student_id)
      const course = courses.find((c) => c.id === enr.course_id)
      const courseDetails = course ? this.getCourseById(course.id, enr.student_id) : null
      return {
        enrollmentId: enr.id,
        student,
        course,
        enrolledAt: enr.enrolled_at,
        progressPercentage: courseDetails?.progress_percentage || 0,
        completedLectures: courseDetails?.completed_lectures_count || 0,
        totalLectures: courseDetails?.total_lectures_count || 0
      }
    })
  },

  // PROGRESS
  updateLectureProgress(
    studentId: string,
    lectureId: string,
    watchedSeconds: number,
    completed?: boolean
  ): LectureProgress {
    const targetId = activeUser.role === 'student' ? activeUser.id : studentId
    const existingIdx = progressList.findIndex(
      (p) => p.student_id === targetId && p.lecture_id === lectureId
    )

    if (existingIdx !== -1) {
      progressList[existingIdx] = {
        ...progressList[existingIdx],
        watched_seconds: Math.max(progressList[existingIdx].watched_seconds, watchedSeconds),
        completed: completed !== undefined ? completed : progressList[existingIdx].completed,
        last_watched_at: new Date().toISOString()
      }
      return progressList[existingIdx]
    } else {
      const newProg: LectureProgress = {
        id: `prog-${Date.now()}`,
        student_id: targetId,
        lecture_id: lectureId,
        watched_seconds: watchedSeconds,
        completed: completed || false,
        last_watched_at: new Date().toISOString()
      }
      progressList.push(newProg)
      return newProg
    }
  },
  toggleLectureCompletion(studentId: string, lectureId: string): LectureProgress {
    const targetId = activeUser.role === 'student' ? activeUser.id : studentId
    const existing = progressList.find(
      (p) => p.student_id === targetId && p.lecture_id === lectureId
    )
    const isCompleted = existing ? !existing.completed : true
    return this.updateLectureProgress(targetId, lectureId, existing?.watched_seconds || 0, isCompleted)
  },
  getRecentLearningLecture(studentId: string) {
    const targetId = activeUser.role === 'student' ? activeUser.id : studentId
    const userProgress = progressList
      .filter((p) => p.student_id === targetId)
      .sort((a, b) => new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime())

    if (userProgress.length === 0) {
      // Return first enrolled course first lecture if available
      const enrolled = this.getStudentEnrollments(studentId)
      if (enrolled.length > 0 && enrolled[0].chapters[0]?.lectures[0]) {
        const firstCourse = enrolled[0]
        const firstLec = firstCourse.chapters[0].lectures[0]
        return {
          course: firstCourse,
          lecture: firstLec,
          progress: { watched_seconds: 0, completed: false }
        }
      }
      return null
    }

    const latest = userProgress[0]
    const details = this.getLectureDetails(latest.lecture_id, studentId)
    if (!details) return null
    return {
      course: details.course,
      chapter: details.chapter,
      lecture: details.lecture,
      progress: latest
    }
  },

  // PLATFORM / ADMIN STATS
  getAdminStats() {
    return {
      totalStudents: profiles.filter((p) => p.role === 'student').length,
      totalTeachers: profiles.filter((p) => p.role === 'teacher' && p.teacher_status === 'approved').length,
      pendingTeachers: profiles.filter((p) => p.role === 'teacher' && p.teacher_status === 'pending').length,
      totalCourses: courses.length,
      publishedCourses: courses.filter((c) => c.status === 'published').length,
      totalLectures: lectures.length,
      totalEnrollments: enrollments.length,
      totalShorts: shorts.length
    }
  },

  // SHORTS VIDEO SECTION
  getShorts(tag?: string, search?: string): ShortVideo[] {
    let result = shorts.map((s) => ({
      ...s,
      teacher: this.getProfileById(s.teacher_id)
    }))

    if (tag && tag !== 'All') {
      const targetTag = tag.toLowerCase().replace('#', '')
      result = result.filter((s) =>
        s.tags.some((t) => t.toLowerCase() === targetTag)
      )
    }

    if (search && search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    return result
  },

  getShortById(id: string): ShortVideo | null {
    const s = shorts.find((item) => item.id === id)
    if (!s) return null
    return {
      ...s,
      teacher: this.getProfileById(s.teacher_id)
    }
  },

  toggleLikeShort(id: string): { likes_count: number; is_liked: boolean } {
    const s = shorts.find((item) => item.id === id)
    if (!s) return { likes_count: 0, is_liked: false }

    s.is_liked = !s.is_liked
    if (s.is_liked) {
      s.likes_count += 1
    } else {
      s.likes_count = Math.max(0, s.likes_count - 1)
    }
    return { likes_count: s.likes_count, is_liked: s.is_liked }
  },

  toggleSaveShort(id: string): { is_saved: boolean } {
    const s = shorts.find((item) => item.id === id)
    if (!s) return { is_saved: false }
    s.is_saved = !s.is_saved
    return { is_saved: s.is_saved }
  },

  incrementShortViews(id: string): void {
    const s = shorts.find((item) => item.id === id)
    if (s) {
      s.views_count += 1
    }
  },

  addShortComment(shortId: string, content: string): ShortComment | null {
    const s = shorts.find((item) => item.id === shortId)
    if (!s || !content.trim()) return null

    const current = activeUser || profiles[0]
    const newComment: ShortComment = {
      id: `comm-${Date.now()}`,
      short_id: shortId,
      user_id: current.id,
      user_name: current.full_name || 'Anonymous Learner',
      user_avatar: current.avatar_url,
      content: content.trim(),
      created_at: new Date().toISOString(),
      likes_count: 0
    }

    s.comments = [newComment, ...(s.comments || [])]
    return newComment
  },

  createShort(data: {
    title: string
    description?: string
    video_url: string
    thumbnail_url?: string
    course_id?: string
    course_title?: string
    tags?: string[]
    duration?: number
  }): ShortVideo {
    const teacher = activeUser || profiles[1]
    const newShort: ShortVideo = {
      id: `short-${Date.now()}`,
      title: data.title,
      description: data.description || '',
      video_url: data.video_url,
      thumbnail_url:
        data.thumbnail_url ||
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
      duration: data.duration || 45,
      teacher_id: teacher.id,
      teacher: teacher,
      course_id: data.course_id,
      course_title: data.course_title,
      views_count: 1,
      likes_count: 0,
      is_liked: false,
      is_saved: false,
      tags: data.tags && data.tags.length > 0 ? data.tags : ['BiteSized', 'Learning'],
      created_at: new Date().toISOString(),
      comments: []
    }

    shorts.unshift(newShort)
    return newShort
  },

  deleteShort(id: string): boolean {
    const initialLen = shorts.length
    shorts = shorts.filter((s) => s.id !== id)
    return shorts.length < initialLen
  },

  // ==========================================
  // NOTIFICATION MANAGEMENT SYSTEM
  // ==========================================
  getNotificationsForUser(
    userId: string,
    role: UserRole,
    options?: { unreadOnly?: boolean; type?: string; limit?: number }
  ): AppNotification[] {
    const readIds = new Set(userReadNotifications[userId] || [])

    // Filter relevant notifications: direct to user, or matching role, or all-user broadcasts
    let userNotifs = notifications.filter((n) => {
      if (n.user_id && n.user_id === userId) return true
      if (n.target_audience === 'all') return true
      if (n.target_audience === 'students' && role === 'student') return true
      if (n.target_audience === 'teachers' && role === 'teacher') return true
      if (n.target_audience === 'admins' && role === 'admin') return true
      return false
    })

    // Map personal read status
    let mapped = userNotifs.map((n) => ({
      ...n,
      is_read: n.user_id ? n.is_read : (n.is_read || readIds.has(n.id))
    }))

    if (options?.unreadOnly) {
      mapped = mapped.filter((n) => !n.is_read)
    }

    if (options?.type && options.type !== 'all') {
      mapped = mapped.filter((n) => n.type === options.type)
    }

    // Sort newest first
    mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    if (options?.limit && options.limit > 0) {
      mapped = mapped.slice(0, options.limit)
    }

    return mapped
  },

  getUnreadCount(userId: string, role: UserRole): number {
    return this.getNotificationsForUser(userId, role, { unreadOnly: true }).length
  },

  markNotificationAsRead(id: string, userId: string): boolean {
    const notif = notifications.find((n) => n.id === id)
    if (!notif) return false

    if (notif.user_id && notif.user_id === userId) {
      notif.is_read = true
      notif.read_at = new Date().toISOString()
    } else {
      if (!userReadNotifications[userId]) {
        userReadNotifications[userId] = []
      }
      if (!userReadNotifications[userId].includes(id)) {
        userReadNotifications[userId].push(id)
      }
    }
    return true
  },

  markAllNotificationsAsRead(userId: string, role: UserRole): boolean {
    const userNotifs = this.getNotificationsForUser(userId, role)
    if (!userReadNotifications[userId]) {
      userReadNotifications[userId] = []
    }

    userNotifs.forEach((n) => {
      if (n.user_id && n.user_id === userId) {
        const item = notifications.find((x) => x.id === n.id)
        if (item) {
          item.is_read = true
          item.read_at = new Date().toISOString()
        }
      } else {
        if (!userReadNotifications[userId].includes(n.id)) {
          userReadNotifications[userId].push(n.id)
        }
      }
    })
    return true
  },

  deleteNotification(id: string): boolean {
    const initialLen = notifications.length
    notifications = notifications.filter((n) => n.id !== id)
    return notifications.length < initialLen
  },

  clearAllNotificationsForUser(userId: string, role: UserRole): boolean {
    const userNotifIds = new Set(
      this.getNotificationsForUser(userId, role).map((n) => n.id)
    )
    notifications = notifications.filter((n) => !userNotifIds.has(n.id))
    delete userReadNotifications[userId]
    return true
  },

  createNotification(
    data: Omit<AppNotification, 'id' | 'created_at' | 'is_read'> & Partial<AppNotification>
  ): AppNotification {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: data.user_id || null,
      target_audience: data.target_audience || 'all',
      title: data.title,
      message: data.message,
      type: data.type || 'system',
      priority: data.priority || 'info',
      link_url: data.link_url || null,
      link_label: data.link_label || null,
      sender_id: data.sender_id || activeUser.id,
      sender_name: data.sender_name || activeUser.full_name || 'Administrator',
      sender_avatar: data.sender_avatar || activeUser.avatar_url || null,
      is_read: false,
      created_at: new Date().toISOString(),
      metadata: data.metadata || {}
    }

    notifications.unshift(newNotif)
    return newNotif
  },

  getAllNotificationsAdmin(filter?: { search?: string; type?: string; audience?: string }): AppNotification[] {
    let list = [...notifications]

    if (filter?.type && filter.type !== 'all') {
      list = list.filter((n) => n.type === filter.type)
    }

    if (filter?.audience && filter.audience !== 'all') {
      list = list.filter((n) => n.target_audience === filter.audience)
    }

    if (filter?.search && filter.search.trim()) {
      const q = filter.search.toLowerCase()
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          n.sender_name?.toLowerCase().includes(q)
      )
    }

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  getAdminNotificationStats(): AdminNotificationStats {
    const totalSent = notifications.length
    let totalRead = 0
    notifications.forEach((n) => {
      if (n.is_read) {
        totalRead++
      } else {
        const hasReads = Object.values(userReadNotifications).some((arr) => arr.includes(n.id))
        if (hasReads) totalRead++
      }
    })

    const readRate = totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0
    const activeBroadcasts = notifications.filter((n) => n.target_audience !== 'user').length
    const studentReach = profiles.filter((p) => p.role === 'student').length
    const teacherReach = profiles.filter((p) => p.role === 'teacher').length

    return {
      totalSent,
      totalRead,
      readRate,
      activeBroadcasts,
      studentReach,
      teacherReach
    }
  },

  getNotificationPreferences(userId: string): NotificationPreferences {
    if (!notificationPreferences[userId]) {
      notificationPreferences[userId] = {
        email_notifications: true,
        push_notifications: true,
        course_announcements: true,
        short_interactions: true,
        system_broadcasts: true,
        sound_enabled: true
      }
    }
    return { ...notificationPreferences[userId] }
  },

  updateNotificationPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): NotificationPreferences {
    const current = this.getNotificationPreferences(userId)
    notificationPreferences[userId] = { ...current, ...updates }
    return { ...notificationPreferences[userId] }
  }
}


import { getOrCreateRef, snapShotToArray } from '../../utils/firebase'
import moment from 'moment'
import { getStudents } from '../student'

const ATTENDANCE_REF_KEY = 'attendances'

export const createAttendance = (period) => {
  const currentDate = moment(new Date()).format('DD/MM/YYYY')
  const attendanceRef = getOrCreateRef(ATTENDANCE_REF_KEY).push()

  attendanceRef.set({
    id: attendanceRef.key,
    date: currentDate,
    period: period
  })

  return attendanceRef.key
}

export const removeAttendance = (attendanceId) => {
  const attendanceRef = getOrCreateRef(`${ATTENDANCE_REF_KEY}/${attendanceId}`)

  attendanceRef.remove()
}

export const getAttendances = (callback) => {
  const attendanceRef = getOrCreateRef(ATTENDANCE_REF_KEY)

  attendanceRef.on('value', snap => {
    callback(snapShotToArray(snap.val()))
  })
}

export const createStudentRegister = async (attendanceId, student) => {
  if (student) {
    createStudentAttendance(attendanceId, student, true)

    return
  }

  const students = await getStudents()
  const studentsPresents = await getStudentsAttendance(attendanceId)
  const studentsNotPresent = getStudentsNotPresent(students, studentsPresents)

  studentsNotPresent.map(student => {
    createStudentAttendance(attendanceId, student, false)
  })
}

const createStudentAttendance = (attendanceId, student, present) => {
  const { code, name } = student
  const ref = getOrCreateRef(`${ATTENDANCE_REF_KEY}/${attendanceId}/students/${code}`)

  ref.set({ code, name, present })
}

export const getStudentsAttendance = (attendanceId, callback) => {
  const ref = getOrCreateRef(`${ATTENDANCE_REF_KEY}/${attendanceId}/students`)

  if (callback) {
    ref.on('value', snap => {
      callback(snapShotToArray(snap.val()))
    })
    return
  }

  return new Promise((resolve, reject) => {
    ref.once('value', snap => {
      resolve(snapShotToArray(snap.val()))
    })
  })
}

export const getStudentsNotPresent = (students, studentsPresent) => {
  let studentsNotPresent = []

  students.forEach(student => {
    const isPresent = studentsPresent.some(sp => sp.code === student.code)

    if(!isPresent) {
      studentsNotPresent.push(student)
    }
  })

  return studentsNotPresent
}

export const removeStudentAttendance = (attendanceId, studentCode) => {
  const ref = getOrCreateRef(`${ATTENDANCE_REF_KEY}/${attendanceId}/students/${studentCode}`)
  ref.remove()
}

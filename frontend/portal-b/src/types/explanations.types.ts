// src/types/explanations.types.ts

export interface University {
  _id: string
  name: string
  icon: string
  portalId?: string
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface College {
  _id: string
  name: string
  icon: string
  description?: string
  universityId: string
  portalId?: string
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface Specialty {
  _id: string
  name: string
  icon: string
  description?: string
  universityId: string
  collegeId: string
  portalId?: string
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface Video {
  _id: string
  title: string
  description?: string
  subjectId: string
  subjectName?: string
  duration?: string
  color?: string
  views?: number
  fileSize?: string
  uploadDate?: Date
  universityId?: string
  collegeId?: string
  specialtyId?: string
  portalId?: string
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface Material {
  _id: string
  title: string
  code: string
  instructor: string
  description: string
  icon: string
  price: number
  isFeatured: boolean
  universityId: string
  collegeId: string
  specialtyId: string
  portalId?: string
  duration?: string
  quizzes?: number
  instructorBio?: string
  features?: string[]
  units?: Array<{
    title: string
    videos: Array<{ title: string; duration: string }>
  }>
  image?: string
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateUniversityDto {
  name: string
  icon: string
}

export interface CreateCollegeDto {
  name: string
  universityId: string
  icon: string
  description?: string
}

export interface CreateSpecialtyDto {
  name: string
  universityId: string
  collegeId: string
  icon: string
  description?: string
}

export interface CreateMaterialDto {
  title: string
  code: string
  instructor: string
  description: string
  icon?: string
  price?: number
  isFeatured?: boolean
  universityId: string
  collegeId: string
  specialtyId: string
  duration?: string
  quizzes?: number
  instructorBio?: string
  features?: string[]
  units?: Array<{
    title: string
    videos: Array<{ title: string; duration: string }>
  }>
  image?: string
}
// src/services/explanationsApi.ts
import type {
  University,
  College,
  Specialty,
  Material,
  Video,
  CreateUniversityDto,
  CreateCollegeDto,
  CreateSpecialtyDto,
  CreateMaterialDto
} from '../types/explanations.types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

// ✅ دوال المساعدة
const getHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

// ✅ معالجة الاستجابة
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorMessage = `خطأ في الطلب: ${response.status}`
    try {
      const data = await response.json()
      if (data.message) errorMessage = data.message
    } catch {
      // إذا لم تكن الاستجابة JSON
    }
    throw new Error(errorMessage)
  }
  const data = await response.json()
  if (!data.success) throw new Error(data.message || 'حدث خطأ')
  return data.data
}

// ============================================================
// ========== الجامعات ==========
// ============================================================

export const fetchUniversities = async (): Promise<University[]> => {
  const response = await fetch(`${API_URL}/api/universities`)
  return handleResponse<University[]>(response)
}

export const createUniversity = async (university: CreateUniversityDto): Promise<University> => {
  const response = await fetch(`${API_URL}/api/universities`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(university)
  })
  return handleResponse<University>(response)
}

export const deleteUniversity = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/universities/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  await handleResponse<void>(response)
}

// ============================================================
// ========== الكليات ==========
// ============================================================

export const fetchColleges = async (): Promise<College[]> => {
  const response = await fetch(`${API_URL}/api/colleges`)
  return handleResponse<College[]>(response)
}

export const createCollege = async (college: CreateCollegeDto): Promise<College> => {
  const response = await fetch(`${API_URL}/api/colleges`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(college)
  })
  return handleResponse<College>(response)
}

export const deleteCollege = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/colleges/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  await handleResponse<void>(response)
}

// ============================================================
// ========== التخصصات ==========
// ============================================================

export const fetchSpecialties = async (): Promise<Specialty[]> => {
  const response = await fetch(`${API_URL}/api/specialties`)
  return handleResponse<Specialty[]>(response)
}

export const createSpecialty = async (specialty: CreateSpecialtyDto): Promise<Specialty> => {
  const response = await fetch(`${API_URL}/api/specialties`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(specialty)
  })
  return handleResponse<Specialty>(response)
}

export const deleteSpecialty = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/specialties/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  await handleResponse<void>(response)
}

// ============================================================
// ========== المواد ==========
// ============================================================

export const fetchMaterials = async (): Promise<Material[]> => {
  const response = await fetch(`${API_URL}/api/explanations/materials`)
  return handleResponse<Material[]>(response)
}

export const fetchMaterialById = async (id: string): Promise<Material> => {
  const response = await fetch(`${API_URL}/api/explanations/materials/${id}`)
  return handleResponse<Material>(response)
}

export const createMaterial = async (material: CreateMaterialDto): Promise<Material> => {
  const response = await fetch(`${API_URL}/api/explanations/materials`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(material)
  })
  return handleResponse<Material>(response)
}

export const updateMaterial = async (id: string, material: Partial<CreateMaterialDto>): Promise<Material> => {
  const response = await fetch(`${API_URL}/api/explanations/materials/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(material)
  })
  return handleResponse<Material>(response)
}

export const deleteMaterial = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/explanations/materials/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  await handleResponse<void>(response)
}

// ============================================================
// ========== الفيديوهات ==========
// ============================================================

export const fetchVideos = async (): Promise<Video[]> => {
  const response = await fetch(`${API_URL}/api/videos/all`)
  return handleResponse<Video[]>(response)
}

export const uploadVideo = async (formData: FormData): Promise<Video> => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_URL}/api/videos/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })
  return handleResponse<Video>(response)
}

export const deleteVideo = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/videos/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  await handleResponse<void>(response)
}
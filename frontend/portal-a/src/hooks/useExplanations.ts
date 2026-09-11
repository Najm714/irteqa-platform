// src/hooks/useExplanations.ts
import { useState, useCallback } from 'react'
import {
  fetchUniversities,
  fetchColleges,
  fetchSpecialties,
  fetchMaterials,
  fetchVideos,
  fetchMaterialById,
  createUniversity,
  deleteUniversity,
  createCollege,
  deleteCollege,
  createSpecialty,
  deleteSpecialty,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  uploadVideo,
  deleteVideo
} from '../services/explanationsApi'
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

// ✅ دالة تأخير
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const useExplanations = () => {
  const [universities, setUniversities] = useState<University[]>([])
  const [colleges, setColleges] = useState<College[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ✅ جلب جميع البيانات
  const fetchAllData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [uni, col, spec, mat, vid] = await Promise.all([
        fetchUniversities(),
        fetchColleges(),
        fetchSpecialties(),
        fetchMaterials(),
        fetchVideos()
      ])

      setUniversities(uni || [])
      setColleges(col || [])
      setSpecialties(spec || [])
      setMaterials(mat || [])
      setVideos(vid || [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ في تحميل البيانات'
      setError(message)
      console.error('❌ Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // ✅ جلب مادة محددة
  const getMaterial = useCallback(async (id: string): Promise<Material> => {
    try {
      return await fetchMaterialById(id)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ في جلب المادة'
      setError(message)
      throw err
    }
  }, [])

  // ===== دوال الإدارة =====

  // ✅ الجامعات
  const addUniversity = useCallback(async (data: CreateUniversityDto): Promise<University> => {
    try {
      const result = await createUniversity(data)
      await fetchAllData()
      return result
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ في إضافة الجامعة'
      setError(message)
      throw err
    }
  }, [fetchAllData])

  const removeUniversity = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteUniversity(id)
      await fetchAllData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ في حذف الجامعة'
      setError(message)
      throw err
    }
  }, [fetchAllData])

  // ✅ الكليات
  const addCollege = useCallback(async (data: CreateCollegeDto): Promise<College> => {
    try {
      const result = await createCollege(data)
      await fetchAllData()
      return result
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ في إضافة الكلية'
      setError(message)
      throw err
    }
  }, [fetchAllData])

  const removeCollege = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteCollege(id)
      await fetchAllData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ في حذف الكلية'
      setError(message)
      throw err
    }
  }, [fetchAllData])

  // ✅ التخصصات
  const addSpecialty = useCallback(async (data: CreateSpecialtyDto): Promise<Specialty> => {
    try {
      const result = await createSpecialty(data)
      await fetchAllData()
      return result
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ في إضافة التخصص'
      setError(message)
      throw err
    }
  }, [fetchAllData])

  const removeSpecialty = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteSpecialty(id)
      await fetchAllData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ في حذف التخصص'
      setError(message)
      throw err
    }
  }, [fetchAllData])

  // ✅ المواد
  const addMaterial = useCallback(async (data: CreateMaterialDto): Promise<Material> => {
    try {
      const result = await createMaterial(data)
      await fetchAllData()
      return result
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ في إضافة المادة'
      setError(message)
      throw err
    }
  }, [fetchAllData])

  const editMaterial = useCallback(async (id: string, data: Partial<CreateMaterialDto>): Promise<Material> => {
    try {
      const result = await updateMaterial(id, data)
      await fetchAllData()
      return result
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ في تحديث المادة'
      setError(message)
      throw err
    }
  }, [fetchAllData])

  const removeMaterial = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteMaterial(id)
      await fetchAllData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ في حذف المادة'
      setError(message)
      throw err
    }
  }, [fetchAllData])

  // ✅ الفيديوهات
  const addVideo = useCallback(async (formData: FormData): Promise<Video> => {
    try {
      const result = await uploadVideo(formData)
      await fetchAllData()
      return result
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ في رفع الفيديو'
      setError(message)
      throw err
    }
  }, [fetchAllData])

  const removeVideo = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteVideo(id)
      await fetchAllData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ في حذف الفيديو'
      setError(message)
      throw err
    }
  }, [fetchAllData])

  return {
    // ✅ البيانات
    universities,
    colleges,
    specialties,
    materials,
    videos,
    loading,
    error,
    
    // ✅ دوال جلب البيانات
    fetchAllData,
    getMaterial,
    
    // ✅ دوال الإدارة
    addUniversity,
    removeUniversity,
    addCollege,
    removeCollege,
    addSpecialty,
    removeSpecialty,
    addMaterial,
    editMaterial,
    removeMaterial,
    addVideo,
    removeVideo
  }
}
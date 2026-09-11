// backend/src/controllers/form.controller.js
import { Form } from '../models/Form.model.js'
import { Request } from '../models/Request.model.js'

// ✅ الحصول على جميع النماذج
export const getForms = async (req, res) => {
  try {
    const portalId = req.portalId
    const { includeHidden = false } = req.query

    const query = { portalId }
    if (!includeHidden) query.isPublished = true

    const forms = await Form.find(query).sort({ name: 1 })

    res.json({
      success: true,
      data: forms,
      total: forms.length,
    })
  } catch (error) {
    console.error('❌ Error in getForms:', error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ✅ الحصول على نموذج محدد
export const getFormById = async (req, res) => {
  try {
    const { id } = req.params
    const portalId = req.portalId

    const form = await Form.findOne({ _id: id, portalId })
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      })
    }

    res.json({
      success: true,
      data: form,
    })
  } catch (error) {
    console.error('❌ Error in getFormById:', error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ✅ إنشاء نموذج جديد (للمدير فقط)
export const createForm = async (req, res) => {
  try {
    const portalId = req.portalId
    const { name, slug, description, fields } = req.body

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Name and slug are required',
      })
    }

    const existing = await Form.findOne({ portalId, slug })
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Form with this slug already exists',
      })
    }

    const form = new Form({
      portalId,
      name,
      slug,
      description,
      fields: fields || [],
    })

    await form.save()

    res.status(201).json({
      success: true,
      data: form,
      message: 'Form created successfully',
    })
  } catch (error) {
    console.error('❌ Error in createForm:', error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ✅ تحديث نموذج (للمدير فقط)
export const updateForm = async (req, res) => {
  try {
    const { id } = req.params
    const portalId = req.portalId
    const updates = req.body

    const form = await Form.findOne({ _id: id, portalId })
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      })
    }

    delete updates.portalId
    Object.assign(form, updates)
    await form.save()

    res.json({
      success: true,
      data: form,
      message: 'Form updated successfully',
    })
  } catch (error) {
    console.error('❌ Error in updateForm:', error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ✅ حذف نموذج (للمدير فقط)
export const deleteForm = async (req, res) => {
  try {
    const { id } = req.params
    const portalId = req.portalId

    const form = await Form.findOne({ _id: id, portalId })
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      })
    }

    form.isPublished = false
    await form.save()

    res.json({
      success: true,
      message: 'Form hidden successfully',
    })
  } catch (error) {
    console.error('❌ Error in deleteForm:', error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ✅ تقديم نموذج (إنشاء طلب)
export const submitForm = async (req, res) => {
  try {
    const portalId = req.portalId
    const accountId = req.accountId
    const { formId, serviceId, requestTypeId, formData } = req.body

    if (!formId || !serviceId || !formData) {
      return res.status(400).json({
        success: false,
        message: 'Form ID, Service ID, and form data are required',
      })
    }

    // الحصول على النموذج
    const form = await Form.findOne({ _id: formId, portalId, isPublished: true })
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or not published',
      })
    }

    // إنشاء طلب جديد
    const request = new Request({
      portalId,
      accountId,
      serviceId,
      requestTypeId,
      formSchemaSnapshot: form.createSnapshot(),
      formData,
      status: 'new',
      paymentStatus: 'pending',
    })

    request.addActivity(
      'request_created',
      accountId,
      req.account.role,
      null,
      { formId, serviceId, requestTypeId }
    )

    await request.save()

    res.status(201).json({
      success: true,
      data: request,
      message: 'Request created successfully',
    })
  } catch (error) {
    console.error('❌ Error in submitForm:', error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
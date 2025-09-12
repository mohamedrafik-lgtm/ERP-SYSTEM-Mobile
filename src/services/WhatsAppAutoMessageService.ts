import AuthService from './AuthService';
import {
  WhatsAppAutoMessage,
  MessagePriority,
  MessageTiming,
  MessageCategory,
  StudentWelcomeMessage,
  StudentUpdateMessage,
  StudentStatusChangeMessage,
  StudentDeletionMessage,
  PaymentDueMessage,
  PaymentConfirmationMessage,
  PaymentReminderMessage,
  PaymentCancellationMessage,
  NewLectureMessage,
  LectureReminderMessage,
  LectureRescheduleMessage,
  LectureCancellationMessage,
  AttendanceReminderMessage,
  AbsenceNotificationMessage,
  LateArrivalMessage,
  UserCreationMessage,
  PasswordResetMessage,
  PermissionChangeMessage,
  UserDeactivationMessage,
  TraineeAssignmentMessage,
  GoalAchievementMessage,
  GoalReminderMessage,
  ProgramStartMessage,
  ProgramCompletionMessage,
  ProgramUpdateMessage,
  NewExamMessage,
  ExamReminderMessage,
  ExamResultMessage,
  MaintenanceNotificationMessage,
  SystemUpdateMessage,
  TechnicalIssueMessage,
  NewEventMessage,
  EventReminderMessage,
  EventCancellationMessage,
  CertificateReadyMessage,
  CertificateReminderMessage,
  InquiryConfirmationMessage,
  InquiryResponseMessage,
} from '../types/whatsapp';

class WhatsAppAutoMessageService {
  private static readonly BASE_URL = 'http://10.0.2.2:4000/api/whatsapp';

  // Helper method to send message
  private static async sendMessage(
    phoneNumber: string,
    message: string,
    category: MessageCategory,
    type: string,
    priority: MessagePriority = 'normal',
    timing: MessageTiming = 'immediate',
    data?: any,
    scheduledAt?: string
  ): Promise<WhatsAppAutoMessage> {
    try {
      const messageData = {
        phoneNumber,
        message,
        category,
        type,
        priority,
        timing,
        data,
        scheduledAt,
      };

      const response = await AuthService.sendWhatsAppMessage({
        phoneNumber,
        message,
      });

      return {
        id: response.messageId || Date.now().toString(),
        category,
        type,
        priority,
        timing,
        phoneNumber,
        message,
        data,
        scheduledAt,
        sentAt: new Date().toISOString(),
        status: response.success ? 'sent' : 'failed',
        error: response.error,
      };
    } catch (error: any) {
      return {
        id: Date.now().toString(),
        category,
        type,
        priority,
        timing,
        phoneNumber,
        message,
        data,
        scheduledAt,
        status: 'failed',
        error: error.message,
      };
    }
  }

  // Helper method to send payment confirmation message
  private static async sendPaymentConfirmationMessage(
    phoneNumber: string,
    message: string,
    category: MessageCategory,
    type: string,
    priority: MessagePriority = 'normal',
    timing: MessageTiming = 'immediate',
    data?: any,
    scheduledAt?: string
  ): Promise<WhatsAppAutoMessage> {
    try {
      const messageData = {
        phoneNumber,
        message,
        category,
        type,
        priority,
        timing,
        data,
        scheduledAt,
      };

      const response = await AuthService.sendPaymentConfirmation({
        phoneNumber,
        message,
      });

      return {
        id: response.messageId || Date.now().toString(),
        category,
        type,
        priority,
        timing,
        phoneNumber,
        message,
        data,
        scheduledAt,
        sentAt: new Date().toISOString(),
        status: response.success ? 'sent' : 'failed',
        error: response.error,
      };
    } catch (error: any) {
      return {
        id: Date.now().toString(),
        category,
        type,
        priority,
        timing,
        phoneNumber,
        message,
        data,
        scheduledAt,
        status: 'failed',
        error: error.message,
      };
    }
  }

  // Helper method to format phone number
  private static formatPhoneNumber(phoneNumber: string): string {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone.startsWith('966') && cleanPhone.length === 9) {
      return `966${cleanPhone}`;
    }
    return cleanPhone;
  }

  // Helper method to format date
  private static formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Helper method to format time
  private static formatTime(time: string): string {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ==================== STUDENT MANAGEMENT ====================

  static async sendStudentWelcomeMessage(
    phoneNumber: string,
    data: StudentWelcomeMessage
  ): Promise<WhatsAppAutoMessage> {
    const message = `🎉 مرحباً ${data.studentName}!

تم تسجيلك بنجاح في برنامج ${data.programName}

📋 بيانات الحساب:
• اسم المستخدم: ${data.loginCredentials.username}
• كلمة المرور: ${data.loginCredentials.password}
• رقم الطالب: ${data.studentId}

📅 تاريخ البداية: ${this.formatDate(data.startDate)}

📞 للاستفسارات: ${data.contactInfo}

نتمنى لك رحلة تعليمية مميزة! 🌟`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'student_management',
      'welcome',
      'important',
      'immediate',
      data
    );
  }

  static async sendStudentUpdateMessage(
    phoneNumber: string,
    data: StudentUpdateMessage
  ): Promise<WhatsAppAutoMessage> {
    const updatedFieldsText = data.updatedFields.join('، ');
    const message = `📝 تم تحديث بياناتك

مرحباً ${data.studentName}

تم تحديث الحقول التالية: ${updatedFieldsText}

📅 تاريخ التحديث: ${this.formatDate(data.updateDate)}
👤 تم التحديث بواسطة: ${data.updatedBy}

إذا كان لديك أي استفسار، يرجى التواصل معنا.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'student_management',
      'update',
      'normal',
      'immediate',
      data
    );
  }

  // Helper method to send trainee update message with specific data
  static async sendTraineeUpdateMessage(
    phoneNumber: string,
    traineeName: string,
    updatedFields: string[],
    updatedBy: string,
    updateDate: string,
    newData?: any
  ): Promise<WhatsAppAutoMessage> {
    const updatedFieldsText = updatedFields.join('، ');
    const message = `📝 تم تحديث بياناتك

مرحباً ${traineeName}

تم تحديث الحقول التالية: ${updatedFieldsText}

📅 تاريخ التحديث: ${this.formatDate(updateDate)}
👤 تم التحديث بواسطة: ${updatedBy}

إذا كان لديك أي استفسار، يرجى التواصل معنا.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'student_management',
      'update',
      'normal',
      'immediate',
      {
        studentName: traineeName,
        updatedFields,
        updatedBy,
        updateDate,
        newData
      }
    );
  }

  // Helper method to send trainee deletion message
  static async sendTraineeDeletionMessage(
    phoneNumber: string,
    traineeName: string,
    reason: string,
    deletedBy: string,
    deletionDate: string
  ): Promise<WhatsAppAutoMessage> {
    const message = `❌ إشعار حذف الحساب

مرحباً ${traineeName}

نأسف لإبلاغك بأنه تم حذف حسابك من النظام

📝 السبب: ${reason}
👤 تم الحذف بواسطة: ${deletedBy}
📅 تاريخ الحذف: ${this.formatDate(deletionDate)}

إذا كان لديك أي استفسار، يرجى التواصل معنا.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'student_management',
      'deletion',
      'urgent',
      'immediate',
      {
        studentName: traineeName,
        reason,
        deletedBy,
        deletionDate
      }
    );
  }

  static async sendStudentStatusChangeMessage(
    phoneNumber: string,
    data: StudentStatusChangeMessage
  ): Promise<WhatsAppAutoMessage> {
    const statusEmoji = {
      'NEW': '🆕',
      'CURRENT': '📚',
      'GRADUATE': '🎓',
      'WITHDRAWN': '❌',
    };

    const message = `📊 تغيير في حالتك الأكاديمية

مرحباً ${data.studentName}

تم تغيير حالتك من ${data.oldStatus} إلى ${data.newStatus}

${statusEmoji[data.newStatus as keyof typeof statusEmoji] || '📋'} الحالة الجديدة: ${data.newStatus}
📅 تاريخ التغيير: ${this.formatDate(data.effectiveDate)}
${data.reason ? `📝 السبب: ${data.reason}` : ''}

نتمنى لك التوفيق في رحلتك التعليمية!`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'student_management',
      'status_change',
      'important',
      'immediate',
      data
    );
  }

  static async sendStudentDeletionMessage(
    phoneNumber: string,
    data: StudentDeletionMessage
  ): Promise<WhatsAppAutoMessage> {
    const message = `❌ إشعار حذف الحساب

مرحباً ${data.studentName}

نأسف لإبلاغك بأنه تم حذف حسابك من النظام

📝 السبب: ${data.reason}
👤 تم الحذف بواسطة: ${data.deletedBy}
📅 تاريخ الحذف: ${this.formatDate(data.deletionDate)}

إذا كان لديك أي استفسار، يرجى التواصل معنا.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'student_management',
      'deletion',
      'urgent',
      'immediate',
      data
    );
  }

  // ==================== PAYMENT MANAGEMENT ====================

  static async sendPaymentDueMessage(
    phoneNumber: string,
    data: PaymentDueMessage
  ): Promise<WhatsAppAutoMessage> {
    const message = `💰 إشعار استحقاق رسوم

مرحباً ${data.studentName}

يستحق عليك دفع الرسوم التالية:

📋 نوع الرسوم: ${data.feeType}
💵 المبلغ: ${data.amount} ريال
📅 تاريخ الاستحقاق: ${this.formatDate(data.dueDate)}
${data.lateFee ? `⚠️ رسوم التأخير: ${data.lateFee} ريال` : ''}

💳 طرق الدفع المتاحة:
${data.paymentMethods.map(method => `• ${method}`).join('\n')}

يرجى الدفع في الموعد المحدد لتجنب رسوم التأخير.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'payment_management',
      'due',
      'important',
      'immediate',
      data
    );
  }

  static async sendPaymentConfirmationMessage(
    phoneNumber: string,
    data: PaymentConfirmationMessage
  ): Promise<WhatsAppAutoMessage> {
    const message = `✅ تأكيد استلام الدفع

مرحباً ${data.studentName}

تم استلام دفعتك بنجاح:

💵 المبلغ المدفوع: ${data.amount} ريال
📄 رقم الإيصال: ${data.receiptNumber}
📅 تاريخ الدفع: ${this.formatDate(data.paymentDate)}
💳 طريقة الدفع: ${data.paymentMethod}
${data.remainingBalance ? `💰 الرصيد المتبقي: ${data.remainingBalance} ريال` : ''}

شكراً لك على دفعك في الموعد المحدد! 🙏`;

    return this.sendPaymentConfirmationMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'payment_management',
      'confirmation',
      'normal',
      'immediate',
      data
    );
  }

  static async sendPaymentReminderMessage(
    phoneNumber: string,
    data: PaymentReminderMessage
  ): Promise<WhatsAppAutoMessage> {
    const message = `⚠️ تذكير بدفع متأخر

مرحباً ${data.studentName}

نذكرك بأن لديك مبلغ متأخر:

💵 المبلغ المتأخر: ${data.amount} ريال
📅 أيام التأخير: ${data.daysOverdue} يوم
💰 رسوم التأخير: ${data.lateFee} ريال
📅 الموعد النهائي: ${this.formatDate(data.finalDueDate)}

يرجى الدفع في أقرب وقت ممكن لتجنب زيادة الرسوم.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'payment_management',
      'reminder',
      'urgent',
      'immediate',
      data
    );
  }

  static async sendPaymentCancellationMessage(
    phoneNumber: string,
    data: PaymentCancellationMessage
  ): Promise<WhatsAppAutoMessage> {
    const message = `❌ إلغاء رسوم

مرحباً ${data.studentName}

تم إلغاء الرسوم التالية:

📋 نوع الرسوم: ${data.feeType}
💵 المبلغ: ${data.amount} ريال
📝 سبب الإلغاء: ${data.reason}
👤 تم الإلغاء بواسطة: ${data.cancelledBy}
📅 تاريخ الإلغاء: ${this.formatDate(data.cancellationDate)}

إذا كان لديك أي استفسار، يرجى التواصل معنا.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'payment_management',
      'cancellation',
      'normal',
      'immediate',
      data
    );
  }

  // ==================== LECTURE MANAGEMENT ====================

  static async sendNewLectureMessage(
    phoneNumber: string,
    data: NewLectureMessage
  ): Promise<WhatsAppAutoMessage> {
    const materialsText = data.materials?.length 
      ? `\n📚 المواد المطلوبة:\n${data.materials.map(material => `• ${material}`).join('\n')}`
      : '';

    const message = `📚 محاضرة جديدة

مرحباً ${data.studentName}

تم جدولة محاضرة جديدة لك:

📖 عنوان المحاضرة: ${data.lectureTitle}
📅 التاريخ: ${this.formatDate(data.date)}
🕐 الوقت: ${this.formatTime(data.time)}
📍 المكان: ${data.location}
👨‍🏫 المحاضر: ${data.instructor}${materialsText}

نتمنى لك حضوراً مميزاً!`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'lecture_management',
      'new_lecture',
      'important',
      'immediate',
      data
    );
  }

  static async sendLectureReminderMessage(
    phoneNumber: string,
    data: LectureReminderMessage
  ): Promise<WhatsAppAutoMessage> {
    const message = `⏰ تذكير بالمحاضرة

مرحباً ${data.studentName}

تذكيرك بمحاضرة:

📖 عنوان المحاضرة: ${data.lectureTitle}
📅 التاريخ: ${this.formatDate(data.date)}
🕐 الوقت: ${this.formatTime(data.time)}
📍 المكان: ${data.location}
⏰ وقت التذكير: ${this.formatTime(data.reminderTime)}

يرجى الحضور في الموعد المحدد.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'lecture_management',
      'reminder',
      'normal',
      'scheduled',
      data,
      data.date
    );
  }

  static async sendLectureRescheduleMessage(
    phoneNumber: string,
    data: LectureRescheduleMessage
  ): Promise<WhatsAppAutoMessage> {
    const message = `🔄 تغيير موعد المحاضرة

مرحباً ${data.studentName}

تم تغيير موعد المحاضرة:

📖 عنوان المحاضرة: ${data.lectureTitle}
❌ الموعد السابق: ${this.formatDate(data.oldDate)} في ${this.formatTime(data.oldTime)}
✅ الموعد الجديد: ${this.formatDate(data.newDate)} في ${this.formatTime(data.newTime)}
📝 سبب التغيير: ${data.reason}

يرجى الحضور في الموعد الجديد.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'lecture_management',
      'reschedule',
      'urgent',
      'immediate',
      data
    );
  }

  static async sendLectureCancellationMessage(
    phoneNumber: string,
    data: LectureCancellationMessage
  ): Promise<WhatsAppAutoMessage> {
    const alternativeText = data.alternativeDate 
      ? `\n📅 موعد بديل: ${this.formatDate(data.alternativeDate)}`
      : '';

    const message = `❌ إلغاء المحاضرة

مرحباً ${data.studentName}

تم إلغاء المحاضرة التالية:

📖 عنوان المحاضرة: ${data.lectureTitle}
📅 التاريخ: ${this.formatDate(data.date)}
🕐 الوقت: ${this.formatTime(data.time)}
📝 سبب الإلغاء: ${data.reason}${alternativeText}

نعتذر عن الإزعاج.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'lecture_management',
      'cancellation',
      'urgent',
      'immediate',
      data
    );
  }

  // ==================== ATTENDANCE MANAGEMENT ====================

  static async sendAttendanceReminderMessage(
    phoneNumber: string,
    data: AttendanceReminderMessage
  ): Promise<WhatsAppAutoMessage> {
    const message = `📝 تذكير بتسجيل الحضور

مرحباً ${data.studentName}

تذكيرك بتسجيل الحضور للمحاضرة:

📖 عنوان المحاضرة: ${data.lectureTitle}
📅 التاريخ: ${this.formatDate(data.date)}
🕐 الوقت: ${this.formatTime(data.time)}
📍 المكان: ${data.location}

يرجى تسجيل الحضور عند وصولك.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'attendance_management',
      'reminder',
      'normal',
      'scheduled',
      data,
      data.date
    );
  }

  static async sendAbsenceNotificationMessage(
    phoneNumber: string,
    data: AbsenceNotificationMessage
  ): Promise<WhatsAppAutoMessage> {
    const reasonText = data.absenceReason 
      ? `\n📝 سبب الغياب: ${data.absenceReason}`
      : '';

    const message = `❌ إشعار غياب

مرحباً ${data.studentName}

تم تسجيل غيابك عن المحاضرة:

📖 عنوان المحاضرة: ${data.lectureTitle}
📅 التاريخ: ${this.formatDate(data.date)}${reasonText}

📋 تعليمات العذر:
${data.excuseInstructions}

يرجى تقديم عذر رسمي في أقرب وقت ممكن.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'attendance_management',
      'absence',
      'normal',
      'immediate',
      data
    );
  }

  static async sendLateArrivalMessage(
    phoneNumber: string,
    data: LateArrivalMessage
  ): Promise<WhatsAppAutoMessage> {
    const message = `⏰ إشعار تأخير

مرحباً ${data.studentName}

تم تسجيل تأخيرك عن المحاضرة:

📖 عنوان المحاضرة: ${data.lectureTitle}
🕐 الموعد المحدد: ${this.formatTime(data.scheduledTime)}
🕐 وقت الوصول: ${this.formatTime(data.actualTime)}
⏱️ مدة التأخير: ${data.delayMinutes} دقيقة

يرجى الحضور في الموعد المحدد في المحاضرات القادمة.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'attendance_management',
      'late_arrival',
      'normal',
      'immediate',
      data
    );
  }

  // ==================== USER MANAGEMENT ====================

  static async sendUserCreationMessage(
    phoneNumber: string,
    data: UserCreationMessage
  ): Promise<WhatsAppAutoMessage> {
    const permissionsText = data.permissions.length 
      ? `\n🔐 الصلاحيات:\n${data.permissions.map(permission => `• ${permission}`).join('\n')}`
      : '';

    const message = `👤 إنشاء حساب جديد

مرحباً ${data.userName}

تم إنشاء حساب جديد لك في النظام:

📋 بيانات الحساب:
• اسم المستخدم: ${data.loginCredentials.username}
• كلمة المرور: ${data.loginCredentials.password}
• الدور: ${data.userRole}${permissionsText}

👤 تم الإنشاء بواسطة: ${data.createdBy}

يمكنك الآن تسجيل الدخول باستخدام البيانات أعلاه.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'user_management',
      'creation',
      'important',
      'immediate',
      data
    );
  }

  static async sendPasswordResetMessage(
    phoneNumber: string,
    data: PasswordResetMessage
  ): Promise<WhatsAppAutoMessage> {
    const linkText = data.resetLink 
      ? `\n🔗 رابط إعادة التعيين: ${data.resetLink}`
      : '';

    const message = `🔑 إعادة تعيين كلمة المرور

مرحباً ${data.userName}

تم طلب إعادة تعيين كلمة المرور لحسابك:

🔢 كود إعادة التعيين: ${data.resetCode}
⏰ مدة الصلاحية: ${this.formatTime(data.expiryTime)}${linkText}

يرجى استخدام الكود أعلاه لإعادة تعيين كلمة المرور.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'user_management',
      'password_reset',
      'urgent',
      'immediate',
      data
    );
  }

  static async sendPermissionChangeMessage(
    phoneNumber: string,
    data: PermissionChangeMessage
  ): Promise<WhatsAppAutoMessage> {
    const oldPermissionsText = data.oldPermissions.length 
      ? `\n❌ الصلاحيات السابقة:\n${data.oldPermissions.map(permission => `• ${permission}`).join('\n')}`
      : '';
    
    const newPermissionsText = data.newPermissions.length 
      ? `\n✅ الصلاحيات الجديدة:\n${data.newPermissions.map(permission => `• ${permission}`).join('\n')}`
      : '';

    const message = `🔐 تغيير الصلاحيات

مرحباً ${data.userName}

تم تغيير صلاحيات حسابك:

${oldPermissionsText}${newPermissionsText}

👤 تم التغيير بواسطة: ${data.changedBy}
📅 تاريخ التغيير: ${this.formatDate(data.changeDate)}

يرجى تسجيل الخروج والدخول مرة أخرى لتفعيل الصلاحيات الجديدة.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'user_management',
      'permission_change',
      'important',
      'immediate',
      data
    );
  }

  static async sendUserDeactivationMessage(
    phoneNumber: string,
    data: UserDeactivationMessage
  ): Promise<WhatsAppAutoMessage> {
    const message = `❌ إلغاء تفعيل الحساب

مرحباً ${data.userName}

تم إلغاء تفعيل حسابك في النظام:

📝 السبب: ${data.reason}
👤 تم الإلغاء بواسطة: ${data.deactivatedBy}
📅 تاريخ الإلغاء: ${this.formatDate(data.deactivationDate)}

إذا كان لديك أي استفسار، يرجى التواصل معنا.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'user_management',
      'deactivation',
      'urgent',
      'immediate',
      data
    );
  }

  // ==================== MARKETING MANAGEMENT ====================

  static async sendTraineeAssignmentMessage(
    phoneNumber: string,
    data: TraineeAssignmentMessage
  ): Promise<WhatsAppAutoMessage> {
    const message = `🎯 تخصيص متدرب جديد

مرحباً ${data.traineeName}

تم تخصيصك لموظف التسويق:

👤 اسم الموظف: ${data.marketerName}
📞 رقم التواصل: ${data.marketerContact}
📅 تاريخ التخصيص: ${this.formatDate(data.assignmentDate)}

📋 تفاصيل البرنامج:
${data.programDetails}

سيتم التواصل معك قريباً من قبل موظف التسويق.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'marketing_management',
      'trainee_assignment',
      'normal',
      'immediate',
      data
    );
  }

  static async sendGoalAchievementMessage(
    phoneNumber: string,
    data: GoalAchievementMessage
  ): Promise<WhatsAppAutoMessage> {
    const bonusText = data.bonus 
      ? `\n🎁 المكافأة: ${data.bonus} ريال`
      : '';

    const message = `🎉 تهانينا! تحقيق الهدف

مرحباً ${data.marketerName}

تهانينا على تحقيق الهدف:

🎯 نوع الهدف: ${data.goalType}
💰 الهدف المحدد: ${data.targetAmount} ريال
✅ المبلغ المحقق: ${data.achievedAmount} ريال
📅 تاريخ التحقيق: ${this.formatDate(data.achievementDate)}${bonusText}

نشكرك على جهودك المتميزة! 🌟`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'marketing_management',
      'goal_achievement',
      'important',
      'immediate',
      data
    );
  }

  static async sendGoalReminderMessage(
    phoneNumber: string,
    data: GoalReminderMessage
  ): Promise<WhatsAppAutoMessage> {
    const message = `⏰ تذكير بالهدف

مرحباً ${data.marketerName}

تذكيرك بالهدف المحدد لك:

🎯 نوع الهدف: ${data.goalType}
💰 الهدف المحدد: ${data.targetAmount} ريال
✅ المبلغ المحقق: ${data.currentAmount} ريال
📊 المبلغ المتبقي: ${data.remainingAmount} ريال
📅 الموعد النهائي: ${this.formatDate(data.deadline)}

استمر في العمل لتحقيق الهدف! 💪`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'marketing_management',
      'goal_reminder',
      'normal',
      'scheduled',
      data,
      data.deadline
    );
  }

  // ==================== PROGRAM MANAGEMENT ====================

  static async sendProgramStartMessage(
    phoneNumber: string,
    data: ProgramStartMessage
  ): Promise<WhatsAppAutoMessage> {
    const materialsText = data.materials.length 
      ? `\n📚 المواد المطلوبة:\n${data.materials.map(material => `• ${material}`).join('\n')}`
      : '';

    const message = `🎓 بداية برنامج جديد

مرحباً ${data.studentName}

مرحباً بك في برنامج ${data.programName}:

📅 تاريخ البداية: ${this.formatDate(data.startDate)}
⏱️ مدة البرنامج: ${data.duration}
📋 الجدول: ${data.schedule}
👨‍🏫 المدرب: ${data.instructor}${materialsText}

نتمنى لك رحلة تعليمية مميزة! 🌟`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'program_management',
      'start',
      'important',
      'immediate',
      data
    );
  }

  static async sendProgramCompletionMessage(
    phoneNumber: string,
    data: ProgramCompletionMessage
  ): Promise<WhatsAppAutoMessage> {
    const nextStepsText = data.nextSteps.length 
      ? `\n📋 الخطوات التالية:\n${data.nextSteps.map(step => `• ${step}`).join('\n')}`
      : '';

    const message = `🎉 تهانينا! إكمال البرنامج

مرحباً ${data.studentName}

تهانينا على إكمال برنامج ${data.programName}:

📅 تاريخ الإكمال: ${this.formatDate(data.completionDate)}
📜 رقم الشهادة: ${data.certificateNumber}
⭐ التقدير: ${data.grade}${nextStepsText}

نشكرك على التزامك ونجاحك! 🏆`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'program_management',
      'completion',
      'important',
      'immediate',
      data
    );
  }

  static async sendProgramUpdateMessage(
    phoneNumber: string,
    data: ProgramUpdateMessage
  ): Promise<WhatsAppAutoMessage> {
    const message = `📝 تحديث البرنامج

مرحباً ${data.studentName}

تم تحديث برنامج ${data.programName}:

📋 المحتوى المحدث:
${data.updatedContent}

📅 تاريخ التحديث: ${this.formatDate(data.updateDate)}
👤 تم التحديث بواسطة: ${data.updatedBy}

يرجى مراجعة التحديثات الجديدة.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'program_management',
      'update',
      'normal',
      'immediate',
      data
    );
  }

  // ==================== EXAM MANAGEMENT ====================

  static async sendNewExamMessage(
    phoneNumber: string,
    data: NewExamMessage
  ): Promise<WhatsAppAutoMessage> {
    const instructionsText = data.instructions.length 
      ? `\n📋 التعليمات:\n${data.instructions.map(instruction => `• ${instruction}`).join('\n')}`
      : '';
    
    const materialsText = data.materials.length 
      ? `\n📚 المواد المسموحة:\n${data.materials.map(material => `• ${material}`).join('\n')}`
      : '';

    const message = `📝 اختبار جديد

مرحباً ${data.studentName}

تم جدولة اختبار جديد لك:

📖 عنوان الاختبار: ${data.examTitle}
📅 التاريخ: ${this.formatDate(data.examDate)}
🕐 الوقت: ${this.formatTime(data.examTime)}
⏱️ المدة: ${data.duration}
📍 المكان: ${data.location}${instructionsText}${materialsText}

نتمنى لك التوفيق! 🍀`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'exam_management',
      'new_exam',
      'important',
      'immediate',
      data
    );
  }

  static async sendExamReminderMessage(
    phoneNumber: string,
    data: ExamReminderMessage
  ): Promise<WhatsAppAutoMessage> {
    const tipsText = data.preparationTips.length 
      ? `\n💡 نصائح التحضير:\n${data.preparationTips.map(tip => `• ${tip}`).join('\n')}`
      : '';

    const message = `⏰ تذكير بالاختبار

مرحباً ${data.studentName}

تذكيرك بالاختبار:

📖 عنوان الاختبار: ${data.examTitle}
📅 التاريخ: ${this.formatDate(data.examDate)}
🕐 الوقت: ${this.formatTime(data.examTime)}${tipsText}

استعد جيداً للاختبار! 📚`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'exam_management',
      'reminder',
      'normal',
      'scheduled',
      data,
      data.examDate
    );
  }

  static async sendExamResultMessage(
    phoneNumber: string,
    data: ExamResultMessage
  ): Promise<WhatsAppAutoMessage> {
    const retakeText = data.retakeInfo 
      ? `\n🔄 معلومات إعادة الاختبار:\n${data.retakeInfo}`
      : '';

    const message = `📊 نتائج الاختبار

مرحباً ${data.studentName}

تم إعلان نتائج اختبار ${data.examTitle}:

📖 عنوان الاختبار: ${data.examTitle}
📊 النتيجة: ${data.score}/${data.totalScore}
⭐ التقدير: ${data.grade}

📝 التقييم:
${data.feedback}${retakeText}

نتمنى لك التوفيق في الاختبارات القادمة! 🎯`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'exam_management',
      'result',
      'important',
      'immediate',
      data
    );
  }

  // ==================== SYSTEM NOTIFICATION ====================

  static async sendMaintenanceNotificationMessage(
    phoneNumber: string,
    data: MaintenanceNotificationMessage
  ): Promise<WhatsAppAutoMessage> {
    const servicesText = data.affectedServices.length 
      ? `\n🔧 الخدمات المتأثرة:\n${data.affectedServices.map(service => `• ${service}`).join('\n')}`
      : '';

    const message = `🔧 إشعار صيانة

سيتم إجراء صيانة على النظام:

📅 تاريخ الصيانة: ${this.formatDate(data.maintenanceDate)}
⏱️ المدة المتوقعة: ${data.duration}${servicesText}

📞 للطوارئ: ${data.alternativeContact}

نعتذر عن الإزعاج ونشكر صبركم.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'system_notification',
      'maintenance',
      'urgent',
      'scheduled',
      data,
      data.maintenanceDate
    );
  }

  static async sendSystemUpdateMessage(
    phoneNumber: string,
    data: SystemUpdateMessage
  ): Promise<WhatsAppAutoMessage> {
    const featuresText = data.newFeatures.length 
      ? `\n✨ الميزات الجديدة:\n${data.newFeatures.map(feature => `• ${feature}`).join('\n')}`
      : '';
    
    const fixesText = data.bugFixes.length 
      ? `\n🐛 الإصلاحات:\n${data.bugFixes.map(fix => `• ${fix}`).join('\n')}`
      : '';
    
    const improvementsText = data.improvements.length 
      ? `\n🚀 التحسينات:\n${data.improvements.map(improvement => `• ${improvement}`).join('\n')}`
      : '';

    const message = `🔄 تحديث النظام

تم تحديث النظام بنجاح:

📅 تاريخ التحديث: ${this.formatDate(data.updateDate)}${featuresText}${fixesText}${improvementsText}

استمتع بالميزات الجديدة! 🎉`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'system_notification',
      'update',
      'normal',
      'immediate',
      data
    );
  }

  static async sendTechnicalIssueMessage(
    phoneNumber: string,
    data: TechnicalIssueMessage
  ): Promise<WhatsAppAutoMessage> {
    const servicesText = data.affectedServices.length 
      ? `\n🔧 الخدمات المتأثرة:\n${data.affectedServices.map(service => `• ${service}`).join('\n')}`
      : '';

    const message = `⚠️ مشكلة تقنية

نواجه مشكلة تقنية في النظام:

📝 وصف المشكلة:
${data.issueDescription}${servicesText}

⏰ الحل المتوقع: ${data.expectedResolution}
📞 للاستفسارات: ${data.contactInfo}

نعمل على حل المشكلة في أقرب وقت ممكن.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'system_notification',
      'technical_issue',
      'urgent',
      'immediate',
      data
    );
  }

  // ==================== EVENT MANAGEMENT ====================

  static async sendNewEventMessage(
    phoneNumber: string,
    data: NewEventMessage
  ): Promise<WhatsAppAutoMessage> {
    const message = `🎉 حدث جديد

تم تنظيم حدث جديد:

🎪 اسم الحدث: ${data.eventName}
📅 التاريخ: ${this.formatDate(data.eventDate)}
🕐 الوقت: ${this.formatTime(data.eventTime)}
📍 المكان: ${data.location}

📝 وصف الحدث:
${data.description}

📋 تعليمات المشاركة:
${data.participationInstructions}

ننتظر مشاركتكم! 🎊`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'event_management',
      'new_event',
      'normal',
      'immediate',
      data
    );
  }

  static async sendEventReminderMessage(
    phoneNumber: string,
    data: EventReminderMessage
  ): Promise<WhatsAppAutoMessage> {
    const message = `⏰ تذكير بالحدث

تذكيرك بالحدث:

🎪 اسم الحدث: ${data.eventName}
📅 التاريخ: ${this.formatDate(data.eventDate)}
🕐 الوقت: ${this.formatTime(data.eventTime)}
📍 المكان: ${data.location}
⏰ وقت التذكير: ${this.formatTime(data.reminderTime)}

ننتظر مشاركتكم! 🎊`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'event_management',
      'reminder',
      'normal',
      'scheduled',
      data,
      data.eventDate
    );
  }

  static async sendEventCancellationMessage(
    phoneNumber: string,
    data: EventCancellationMessage
  ): Promise<WhatsAppAutoMessage> {
    const alternativeText = data.alternativeEvent 
      ? `\n🎪 حدث بديل: ${data.alternativeEvent}`
      : '';

    const message = `❌ إلغاء الحدث

تم إلغاء الحدث التالي:

🎪 اسم الحدث: ${data.eventName}
📅 التاريخ: ${this.formatDate(data.eventDate)}
📝 سبب الإلغاء: ${data.reason}${alternativeText}

نعتذر عن الإزعاج.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'event_management',
      'cancellation',
      'urgent',
      'immediate',
      data
    );
  }

  // ==================== CERTIFICATE MANAGEMENT ====================

  static async sendCertificateReadyMessage(
    phoneNumber: string,
    data: CertificateReadyMessage
  ): Promise<WhatsAppAutoMessage> {
    const documentsText = data.requiredDocuments.length 
      ? `\n📄 المستندات المطلوبة:\n${data.requiredDocuments.map(doc => `• ${doc}`).join('\n')}`
      : '';

    const message = `🏆 الشهادة جاهزة

مرحباً ${data.studentName}

شهادتك جاهزة للاستلام:

📜 نوع الشهادة: ${data.certificateType}
🎓 البرنامج: ${data.programName}
📅 تاريخ الاستلام: ${this.formatDate(data.collectionDate)}
📍 مكان الاستلام: ${data.collectionLocation}${documentsText}

تهانينا على إكمال البرنامج! 🎉`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'certificate_management',
      'ready',
      'important',
      'immediate',
      data
    );
  }

  static async sendCertificateReminderMessage(
    phoneNumber: string,
    data: CertificateReminderMessage
  ): Promise<WhatsAppAutoMessage> {
    const message = `⏰ تذكير باستلام الشهادة

مرحباً ${data.studentName}

تذكيرك باستلام شهادتك:

📜 نوع الشهادة: ${data.certificateType}
📅 الموعد النهائي: ${this.formatDate(data.collectionDeadline)}
📍 مكان الاستلام: ${data.collectionLocation}
📞 للاستفسارات: ${data.contactInfo}

يرجى استلام الشهادة في الموعد المحدد.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'certificate_management',
      'reminder',
      'normal',
      'scheduled',
      data,
      data.collectionDeadline
    );
  }

  // ==================== INQUIRY MANAGEMENT ====================

  static async sendInquiryConfirmationMessage(
    phoneNumber: string,
    data: InquiryConfirmationMessage
  ): Promise<WhatsAppAutoMessage> {
    const message = `📞 تأكيد استلام الاستفسار

تم استلام استفسارك بنجاح:

🔢 رقم المتابعة: ${data.inquiryNumber}
⏰ وقت الرد المتوقع: ${data.responseTime}
📞 للاستفسارات: ${data.contactInfo}
📊 الحالة: ${data.status}

سيتم الرد على استفسارك في أقرب وقت ممكن.`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'inquiry_management',
      'confirmation',
      'normal',
      'immediate',
      data
    );
  }

  static async sendInquiryResponseMessage(
    phoneNumber: string,
    data: InquiryResponseMessage
  ): Promise<WhatsAppAutoMessage> {
    const followUpText = data.followUpRequired 
      ? '\n📞 سيتم التواصل معك للمتابعة.'
      : '';

    const message = `📝 رد على استفسارك

🔢 رقم الاستفسار: ${data.inquiryNumber}

📝 الرد:
${data.response}

${data.additionalInfo ? `📋 معلومات إضافية:\n${data.additionalInfo}` : ''}${followUpText}

شكراً لاستفسارك! 🙏`;

    return this.sendMessage(
      this.formatPhoneNumber(phoneNumber),
      message,
      'inquiry_management',
      'response',
      'normal',
      'immediate',
      data
    );
  }
}

export default WhatsAppAutoMessageService;

/**
 * Context-Aware Communication Drafting
 * 
 * Generates intelligent communication drafts based on context,
 * relationship history, and task-related information.
 */

import {
  CommunicationContext,
  DraftedCommunication,
  CommunicationTone,
  CommunicationPurpose,
  Recipient,
  Message,
  Task,
  CalendarEvent,
} from '../types';

// ============================================================================
// TEMPLATES
// ============================================================================

interface MessageTemplate {
  purpose: CommunicationPurpose;
  tones: CommunicationTone[];
  subjectTemplates: string[];
  bodyTemplates: string[];
  closings: string[];
}

const TEMPLATES: MessageTemplate[] = [
  {
    purpose: 'follow_up',
    tones: ['professional', 'friendly'],
    subjectTemplates: [
      'Following up: {subject}',
      'Quick follow-up on {subject}',
      'Checking in on {subject}',
    ],
    bodyTemplates: [
      'I wanted to follow up on {topic}. {context}',
      'Just checking in regarding {topic}. {context}',
      'I hope this finds you well. I wanted to touch base about {topic}. {context}',
    ],
    closings: [
      'Let me know if you have any questions.',
      'Looking forward to hearing from you.',
      'Please let me know how you\'d like to proceed.',
    ],
  },
  {
    purpose: 'request',
    tones: ['professional', 'formal'],
    subjectTemplates: [
      'Request: {subject}',
      'Could you help with {subject}?',
      '{subject} - Need your input',
    ],
    bodyTemplates: [
      'I\'m reaching out because I need your help with {topic}. {context}',
      'I was hoping you could assist me with {topic}. {context}',
      'Would you be able to {action}? {context}',
    ],
    closings: [
      'I appreciate your help with this.',
      'Thank you in advance for your assistance.',
      'Please let me know if this works for you.',
    ],
  },
  {
    purpose: 'update',
    tones: ['professional', 'friendly', 'casual'],
    subjectTemplates: [
      'Update: {subject}',
      'Progress on {subject}',
      '{subject} - Status update',
    ],
    bodyTemplates: [
      'I wanted to give you a quick update on {topic}. {context}',
      'Here\'s where things stand with {topic}: {context}',
      'Quick update: {context}',
    ],
    closings: [
      'Let me know if you need any additional information.',
      'Happy to discuss further if needed.',
      'I\'ll keep you posted on any developments.',
    ],
  },
  {
    purpose: 'scheduling',
    tones: ['professional', 'friendly'],
    subjectTemplates: [
      'Meeting request: {subject}',
      'Scheduling: {subject}',
      'Can we meet about {subject}?',
    ],
    bodyTemplates: [
      'I\'d like to schedule some time to discuss {topic}. {context}',
      'Would you be available to meet about {topic}? {context}',
      'I was hoping we could find time to talk about {topic}. {context}',
    ],
    closings: [
      'Please let me know what times work for you.',
      'Here are some times that work for me: {times}',
      'Feel free to send me a calendar invite.',
    ],
  },
  {
    purpose: 'thank_you',
    tones: ['professional', 'friendly', 'casual'],
    subjectTemplates: [
      'Thank you!',
      'Thanks for {subject}',
      'Appreciated!',
    ],
    bodyTemplates: [
      'Thank you so much for {topic}. {context}',
      'I really appreciate your help with {topic}. {context}',
      'Just wanted to say thanks for {topic}. {context}',
    ],
    closings: [
      'Thanks again!',
      'Much appreciated.',
      'Looking forward to working together again.',
    ],
  },
  {
    purpose: 'reminder',
    tones: ['professional', 'friendly'],
    subjectTemplates: [
      'Reminder: {subject}',
      'Friendly reminder about {subject}',
      'Don\'t forget: {subject}',
    ],
    bodyTemplates: [
      'Just a quick reminder about {topic}. {context}',
      'I wanted to remind you that {topic}. {context}',
      'This is a friendly reminder about {topic}. {context}',
    ],
    closings: [
      'Please let me know if you have any questions.',
      'Thanks for taking care of this.',
      'Let me know if the timeline needs to change.',
    ],
  },
  {
    purpose: 'apology',
    tones: ['professional', 'formal'],
    subjectTemplates: [
      'Apologies for {subject}',
      'Sorry about {subject}',
      'Regarding {subject}',
    ],
    bodyTemplates: [
      'I apologize for {topic}. {context}',
      'I\'m sorry about {topic}. {context}',
      'I wanted to reach out regarding {topic}. {context}',
    ],
    closings: [
      'Thank you for your understanding.',
      'Please let me know how I can make this right.',
      'I appreciate your patience.',
    ],
  },
  {
    purpose: 'introduction',
    tones: ['professional', 'friendly'],
    subjectTemplates: [
      'Introduction: {subject}',
      'Nice to meet you!',
      'Connecting about {subject}',
    ],
    bodyTemplates: [
      'I wanted to introduce myself. {context}',
      'It\'s great to connect with you. {context}',
      '{referrer} suggested I reach out to you about {topic}. {context}',
    ],
    closings: [
      'I\'d love to connect further.',
      'Looking forward to getting to know you better.',
      'Would love to chat sometime.',
    ],
  },
];

// ============================================================================
// TONE ADJUSTMENTS
// ============================================================================

interface ToneProfile {
  greetings: string[];
  signoffs: string[];
  modifiers: {
    add: string[];
    remove: RegExp[];
  };
}

const TONE_PROFILES: Record<CommunicationTone, ToneProfile> = {
  formal: {
    greetings: ['Dear {name},', 'Good {timeOfDay} {name},'],
    signoffs: ['Best regards,', 'Sincerely,', 'Respectfully,'],
    modifiers: {
      add: [],
      remove: [/\b(hey|hi|thanks|cheers)\b/gi],
    },
  },
  professional: {
    greetings: ['Hi {name},', 'Hello {name},', 'Good {timeOfDay} {name},'],
    signoffs: ['Best,', 'Thank you,', 'Regards,'],
    modifiers: {
      add: [],
      remove: [/\b(hey|yo|sup)\b/gi],
    },
  },
  friendly: {
    greetings: ['Hi {name}!', 'Hey {name},', 'Hello!'],
    signoffs: ['Thanks!', 'Cheers,', 'Talk soon,'],
    modifiers: {
      add: ['!'],
      remove: [],
    },
  },
  casual: {
    greetings: ['Hey {name}!', 'Hi!', 'Yo!'],
    signoffs: ['Cheers!', 'Later!', 'Thanks!', '🙌'],
    modifiers: {
      add: ['!', '😊'],
      remove: [/\bI would like to\b/gi],
    },
  },
  urgent: {
    greetings: ['{name},', 'Hi {name} - urgent:'],
    signoffs: ['Please respond ASAP.', 'Time-sensitive - thanks for quick response.'],
    modifiers: {
      add: ['URGENT:', '⚠️'],
      remove: [],
    },
  },
};

// ============================================================================
// COMMUNICATION DRAFTER
// ============================================================================

export class CommunicationDrafter {
  /**
   * Generate a communication draft based on context
   */
  draft(context: CommunicationContext): DraftedCommunication {
    const template = this.selectTemplate(context.purpose, context.tone);
    const toneProfile = TONE_PROFILES[context.tone];

    // Build the subject
    const subject = this.buildSubject(template, context);

    // Build the body
    const body = this.buildBody(template, toneProfile, context);

    // Generate alternatives
    const alternatives = this.generateAlternatives(context);

    // Track what context was used
    const contextUsed = this.trackContextUsage(context);

    return {
      subject,
      body,
      suggestedRecipients: this.suggestRecipients(context),
      tone: context.tone,
      confidence: this.calculateConfidence(context),
      alternatives,
      contextUsed,
    };
  }

  /**
   * Draft a follow-up message for a task
   */
  draftTaskFollowUp(task: Task, recipient: Recipient): DraftedCommunication {
    const context: CommunicationContext = {
      recipient,
      previousMessages: [],
      relatedTasks: [task],
      relatedEvents: [],
      tone: this.inferTone(recipient),
      purpose: 'follow_up',
    };

    return this.draft(context);
  }

  /**
   * Draft a meeting request
   */
  draftMeetingRequest(
    recipient: Recipient,
    event: CalendarEvent,
    availableTimes: string[]
  ): DraftedCommunication {
    const context: CommunicationContext = {
      recipient,
      previousMessages: [],
      relatedTasks: [],
      relatedEvents: [event],
      tone: this.inferTone(recipient),
      purpose: 'scheduling',
    };

    const draft = this.draft(context);

    // Add available times to the closing
    if (availableTimes.length > 0) {
      const timesStr = availableTimes.slice(0, 3).join('\n• ');
      draft.body = draft.body.replace(
        '{times}',
        `\n\n• ${timesStr}\n\nLet me know what works best.`
      );
    }

    return draft;
  }

  /**
   * Draft an update message
   */
  draftStatusUpdate(
    recipients: Recipient[],
    tasks: Task[],
    summary: string
  ): DraftedCommunication {
    const primaryRecipient = recipients[0] ?? {
      id: 'team',
      name: 'Team',
      relationship: 'colleague' as const,
    };

    const context: CommunicationContext = {
      recipient: primaryRecipient,
      previousMessages: [],
      relatedTasks: tasks,
      relatedEvents: [],
      tone: 'professional',
      purpose: 'update',
    };

    const draft = this.draft(context);

    // Add task summary
    const taskList = tasks
      .map(t => `• ${t.title}${t.status === 'done' ? ' ✓' : ''}`)
      .join('\n');

    draft.body = draft.body.replace('{context}', `\n\n${summary}\n\nTasks:\n${taskList}`);

    if (recipients.length > 1) {
      draft.suggestedRecipients = recipients.map(r => r.name);
    }

    return draft;
  }

  /**
   * Adjust tone of existing draft
   */
  adjustTone(draft: DraftedCommunication, newTone: CommunicationTone): DraftedCommunication {
    const toneProfile = TONE_PROFILES[newTone];
    let body = draft.body;

    // Apply tone modifiers
    for (const pattern of toneProfile.modifiers.remove) {
      body = body.replace(pattern, '');
    }

    // Update greeting
    const greetingMatch = body.match(/^(Hi|Hello|Hey|Dear|Good \w+)[^,]*,?/);
    if (greetingMatch) {
      const newGreeting = toneProfile.greetings[0].replace('{name}', this.extractName(greetingMatch[0]));
      body = body.replace(greetingMatch[0], newGreeting);
    }

    return {
      ...draft,
      body,
      tone: newTone,
    };
  }

  /**
   * Suggest reply based on received message
   */
  suggestReply(
    receivedMessage: Message,
    recipient: Recipient,
    relatedTasks: Task[]
  ): DraftedCommunication {
    const intent = this.analyzeMessageIntent(receivedMessage.content);
    const tone = this.inferToneFromMessage(receivedMessage.content);

    const context: CommunicationContext = {
      recipient,
      previousMessages: [receivedMessage],
      relatedTasks,
      relatedEvents: [],
      tone,
      purpose: intent,
    };

    return this.draft(context);
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private selectTemplate(purpose: CommunicationPurpose, tone: CommunicationTone): MessageTemplate {
    const matching = TEMPLATES.filter(t => t.purpose === purpose && t.tones.includes(tone));
    if (matching.length > 0) return matching[0];

    // Fallback to any template with matching purpose
    const purposeMatch = TEMPLATES.filter(t => t.purpose === purpose);
    if (purposeMatch.length > 0) return purposeMatch[0];

    // Default to follow_up
    return TEMPLATES[0];
  }

  private buildSubject(template: MessageTemplate, context: CommunicationContext): string {
    const subjectTemplate = this.randomChoice(template.subjectTemplates);
    let subject = subjectTemplate;

    // Replace placeholders
    subject = subject.replace('{subject}', this.extractSubject(context));
    subject = subject.replace('{topic}', this.extractTopic(context));

    return subject;
  }

  private buildBody(
    template: MessageTemplate,
    toneProfile: ToneProfile,
    context: CommunicationContext
  ): string {
    const parts: string[] = [];

    // Greeting
    const greeting = this.randomChoice(toneProfile.greetings)
      .replace('{name}', context.recipient.name)
      .replace('{timeOfDay}', this.getTimeOfDay());
    parts.push(greeting);

    // Body
    const bodyTemplate = this.randomChoice(template.bodyTemplates);
    let body = bodyTemplate
      .replace('{topic}', this.extractTopic(context))
      .replace('{context}', this.extractContext(context))
      .replace('{action}', this.extractAction(context))
      .replace('{referrer}', '');
    parts.push('\n' + body);

    // Closing
    const closing = this.randomChoice(template.closings);
    parts.push('\n\n' + closing);

    // Signoff
    const signoff = this.randomChoice(toneProfile.signoffs);
    parts.push('\n\n' + signoff);

    return parts.join('');
  }

  private generateAlternatives(context: CommunicationContext): string[] {
    const alternatives: string[] = [];

    // Generate with different tones
    const alternateTones: CommunicationTone[] = ['professional', 'friendly', 'formal']
      .filter(t => t !== context.tone) as CommunicationTone[];

    for (const tone of alternateTones.slice(0, 2)) {
      const altContext = { ...context, tone };
      const template = this.selectTemplate(context.purpose, tone);
      const toneProfile = TONE_PROFILES[tone];
      alternatives.push(this.buildBody(template, toneProfile, altContext));
    }

    return alternatives;
  }

  private trackContextUsage(context: CommunicationContext): string[] {
    const used: string[] = [];

    if (context.relatedTasks.length > 0) {
      used.push(`${context.relatedTasks.length} related task(s)`);
    }
    if (context.relatedEvents.length > 0) {
      used.push(`${context.relatedEvents.length} calendar event(s)`);
    }
    if (context.previousMessages.length > 0) {
      used.push(`${context.previousMessages.length} previous message(s)`);
    }
    used.push(`Recipient: ${context.recipient.name} (${context.recipient.relationship})`);

    return used;
  }

  private calculateConfidence(context: CommunicationContext): number {
    let confidence = 0.6; // Base confidence

    // More context = higher confidence
    if (context.previousMessages.length > 0) confidence += 0.15;
    if (context.relatedTasks.length > 0) confidence += 0.1;
    if (context.relatedEvents.length > 0) confidence += 0.1;
    if (context.recipient.preferredStyle) confidence += 0.1;

    return Math.min(0.95, confidence);
  }

  private suggestRecipients(context: CommunicationContext): string[] {
    const suggestions: string[] = [context.recipient.name];

    // Add recipients from related tasks
    // (In a real implementation, this would look up task assignees/watchers)

    return suggestions;
  }

  private inferTone(recipient: Recipient): CommunicationTone {
    // Use preferred style if available
    if (recipient.preferredStyle) return recipient.preferredStyle;

    // Infer from relationship
    switch (recipient.relationship) {
      case 'client':
      case 'manager':
        return 'professional';
      case 'colleague':
        return 'friendly';
      case 'friend':
      case 'family':
        return 'casual';
      case 'acquaintance':
      default:
        return 'professional';
    }
  }

  private inferToneFromMessage(content: string): CommunicationTone {
    const lowerContent = content.toLowerCase();

    // Check for casual indicators
    if (lowerContent.includes('hey') || lowerContent.includes('yo') || content.includes('!')) {
      return 'friendly';
    }

    // Check for formal indicators
    if (lowerContent.includes('dear') || lowerContent.includes('sincerely')) {
      return 'formal';
    }

    // Check for urgency
    if (lowerContent.includes('urgent') || lowerContent.includes('asap')) {
      return 'urgent';
    }

    return 'professional';
  }

  private analyzeMessageIntent(content: string): CommunicationPurpose {
    const lowerContent = content.toLowerCase();

    // Look for keywords to determine intent
    if (lowerContent.includes('thank') || lowerContent.includes('appreciate')) {
      return 'thank_you';
    }
    if (lowerContent.includes('meet') || lowerContent.includes('schedule') || lowerContent.includes('call')) {
      return 'scheduling';
    }
    if (lowerContent.includes('update') || lowerContent.includes('status') || lowerContent.includes('progress')) {
      return 'update';
    }
    if (lowerContent.includes('help') || lowerContent.includes('could you') || lowerContent.includes('would you')) {
      return 'request';
    }
    if (lowerContent.includes('remind') || lowerContent.includes('don\'t forget')) {
      return 'reminder';
    }
    if (lowerContent.includes('sorry') || lowerContent.includes('apologize')) {
      return 'apology';
    }

    return 'follow_up';
  }

  private extractSubject(context: CommunicationContext): string {
    // Try to get subject from tasks
    if (context.relatedTasks.length > 0) {
      return context.relatedTasks[0].title;
    }

    // Try to get subject from events
    if (context.relatedEvents.length > 0) {
      return context.relatedEvents[0].title;
    }

    // Try to get subject from previous messages
    if (context.previousMessages.length > 0) {
      return this.extractTopicFromMessage(context.previousMessages[0].content);
    }

    return 'our discussion';
  }

  private extractTopic(context: CommunicationContext): string {
    return this.extractSubject(context);
  }

  private extractContext(context: CommunicationContext): string {
    const parts: string[] = [];

    // Add task context
    if (context.relatedTasks.length > 0) {
      const task = context.relatedTasks[0];
      if (task.dueAt) {
        parts.push(`The deadline is ${task.dueAt.toLocaleDateString()}.`);
      }
      if (task.status === 'blocked') {
        parts.push('We\'re currently blocked on this and could use your input.');
      }
    }

    // Add event context
    if (context.relatedEvents.length > 0) {
      const event = context.relatedEvents[0];
      parts.push(`This is regarding our meeting on ${event.startAt.toLocaleDateString()}.`);
    }

    return parts.join(' ');
  }

  private extractAction(context: CommunicationContext): string {
    if (context.relatedTasks.length > 0) {
      const task = context.relatedTasks[0];
      return `help with "${task.title}"`;
    }
    return 'help with this matter';
  }

  private extractTopicFromMessage(content: string): string {
    // Simple extraction: first sentence or first 50 chars
    const firstSentence = content.split(/[.!?]/)[0];
    return firstSentence.slice(0, 50) + (firstSentence.length > 50 ? '...' : '');
  }

  private extractName(greeting: string): string {
    // Extract name from greeting like "Hi John," or "Dear Sarah,"
    const match = greeting.match(/(?:Hi|Hello|Hey|Dear|Good \w+)\s+([^,]+)/i);
    return match ? match[1] : '';
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create a new drafter instance
 */
export function createDrafter(): CommunicationDrafter {
  return new CommunicationDrafter();
}

/**
 * Quick draft for a task follow-up
 */
export function draftFollowUp(task: Task, recipientName: string): DraftedCommunication {
  const drafter = new CommunicationDrafter();
  return drafter.draftTaskFollowUp(task, {
    id: 'temp',
    name: recipientName,
    relationship: 'colleague',
  });
}

/**
 * Quick draft for a meeting request
 */
export function draftMeetingRequest(
  recipientName: string,
  topic: string,
  availableTimes: string[]
): DraftedCommunication {
  const drafter = new CommunicationDrafter();
  const event: CalendarEvent = {
    id: 'temp',
    title: topic,
    startAt: new Date(),
    endAt: new Date(),
    isBlocking: true,
  };
  return drafter.draftMeetingRequest(
    { id: 'temp', name: recipientName, relationship: 'colleague' },
    event,
    availableTimes
  );
}

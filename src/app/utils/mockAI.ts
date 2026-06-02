import { Note } from '../types';

export function generateAISummary(content: string): string {
  const words = content.split(' ').length;

  if (content.toLowerCase().includes('meeting')) {
    return 'Work meeting notes with action items and follow-ups';
  }
  if (content.toLowerCase().includes('grocery') || content.toLowerCase().includes('shopping')) {
    return 'Shopping list with essential items';
  }
  if (content.toLowerCase().includes('project') || content.toLowerCase().includes('app')) {
    return 'Technical project planning and ideas';
  }
  if (content.toLowerCase().includes('workout') || content.toLowerCase().includes('exercise')) {
    return 'Fitness routine and health tracking';
  }
  if (content.toLowerCase().includes('book') || content.toLowerCase().includes('read')) {
    return 'Reading list and recommendations';
  }
  if (content.toLowerCase().includes('vacation') || content.toLowerCase().includes('travel')) {
    return 'Travel planning and preparation checklist';
  }

  return words > 20 ? 'Detailed notes with multiple topics' : 'Quick note';
}

export function extractReminders(content: string, noteId: string): Array<{ title: string; remindAt: string; context: string }> {
  const reminders: Array<{ title: string; remindAt: string; context: string }> = [];
  const lowerContent = content.toLowerCase();

  // Extract date-related phrases
  if (lowerContent.includes('call') && (lowerContent.includes('weekend') || lowerContent.includes('tomorrow'))) {
    const match = content.match(/call ([a-zA-Z]+)/i);
    if (match) {
      reminders.push({
        title: `Call ${match[1]}`,
        remindAt: lowerContent.includes('weekend') ? 'This Saturday at 10:00 AM' : 'Tomorrow at 10:00 AM',
        context: `From note: ${content.substring(0, 50)}...`
      });
    }
  }

  if (lowerContent.includes('follow up') || lowerContent.includes('followup')) {
    const match = content.match(/follow up (?:with )?([a-zA-Z]+)/i);
    if (match) {
      reminders.push({
        title: `Follow up with ${match[1]}`,
        remindAt: 'Tomorrow at 2:00 PM',
        context: `From note: ${content.substring(0, 50)}...`
      });
    }
  }

  if (lowerContent.includes('dentist') || lowerContent.includes('doctor') || lowerContent.includes('appointment')) {
    reminders.push({
      title: 'Medical appointment',
      remindAt: 'Next week',
      context: `From note: ${content.substring(0, 50)}...`
    });
  }

  return reminders;
}

export function suggestTags(content: string): string[] {
  const tags: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('meeting') || lowerContent.includes('work')) tags.push('work');
  if (lowerContent.includes('project') || lowerContent.includes('app') || lowerContent.includes('code')) tags.push('tech');
  if (lowerContent.includes('grocery') || lowerContent.includes('shopping')) tags.push('shopping');
  if (lowerContent.includes('personal') || lowerContent.includes('family')) tags.push('personal');
  if (lowerContent.includes('idea') || lowerContent.includes('brainstorm')) tags.push('ideas');
  if (lowerContent.includes('workout') || lowerContent.includes('exercise') || lowerContent.includes('fitness')) tags.push('health');
  if (lowerContent.includes('book') || lowerContent.includes('read') || lowerContent.includes('learning')) tags.push('learning');
  if (lowerContent.includes('vacation') || lowerContent.includes('travel') || lowerContent.includes('trip')) tags.push('travel');

  // Add generic tags if nothing specific
  if (tags.length === 0) {
    tags.push('notes');
  }

  return tags.slice(0, 3); // Max 3 tags
}

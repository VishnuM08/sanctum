import React from 'react';

// Import image assets
import notionCalendar from '../assets/notion/notion_calendar.png';
import notionChat from '../assets/notion/notion_chat.png';
import notionFolder from '../assets/notion/notion_folder.png';
import notionHappy from '../assets/notion/notion_happy.png';
import notionIdea from '../assets/notion/notion_idea.png';
import notionLove from '../assets/notion/notion_love.png';
import notionPage from '../assets/notion/notion_page.png';
import notionParty from '../assets/notion/notion_party.png';
import notionSecure from '../assets/notion/notion_secure.png';
import notionWork from '../assets/notion/notion_work.png';

export const NOTION_IMAGES: Record<string, string> = {
  notion_page: notionPage,
  notion_happy: notionHappy,
  notion_work: notionWork,
  notion_party: notionParty,
  notion_secure: notionSecure,
  notion_idea: notionIdea,
  notion_love: notionLove,
  notion_calendar: notionCalendar,
  notion_folder: notionFolder,
  notion_chat: notionChat,
};

// Emoji to Notion-style doodle mappings
const EMOJI_MAP: Record<string, string> = {
  // Page / Document
  '📄': 'notion_page', '📝': 'notion_page', '✏️': 'notion_page', '🖋️': 'notion_page', '🖊️': 'notion_page', '✍️': 'notion_page', '📚': 'notion_page',
  
  // Folder / Category
  '📁': 'notion_folder', '📂': 'notion_folder', '🗂️': 'notion_folder',
  
  // Chat / Message / Hello
  '💬': 'notion_chat', '💭': 'notion_chat', '🗯️': 'notion_chat', '🗣️': 'notion_chat', '👋': 'notion_chat',
  
  // Calendar / Time
  '📅': 'notion_calendar', '📆': 'notion_calendar', '🗓️': 'notion_calendar', '⏰': 'notion_calendar', '⏱️': 'notion_calendar', '⏲️': 'notion_calendar', '🕰️': 'notion_calendar', '⌛': 'notion_calendar', '⏳': 'notion_calendar',
  
  // Secure / Vault / Lock
  '🔒': 'notion_secure', '🔓': 'notion_secure', '🔏': 'notion_secure', '🔐': 'notion_secure', '🔑': 'notion_secure', '🗝️': 'notion_secure', '🛡️': 'notion_secure', '🗄️': 'notion_secure',
  
  // Idea / Target / Goal
  '💡': 'notion_idea', '⚡': 'notion_idea', '🌟': 'notion_idea', '✨': 'notion_idea', '⭐': 'notion_idea', '🎯': 'notion_idea',
  
  // Love / Heart
  '❤️': 'notion_love', '🧡': 'notion_love', '💛': 'notion_love', '💚': 'notion_love', '💙': 'notion_love', '💜': 'notion_love', '🖤': 'notion_love', '🤍': 'notion_love', '🤎': 'notion_love', '💔': 'notion_love', '💕': 'notion_love', '💞': 'notion_love', '💓': 'notion_love', '💗': 'notion_love', '💖': 'notion_love', '💘': 'notion_love', '💝': 'notion_love',
  
  // Party / Rocket / Celebrate
  '🚀': 'notion_party', '🎉': 'notion_party', '🎊': 'notion_party', '🎈': 'notion_party', '🥳': 'notion_party', '🎂': 'notion_party', '🎪': 'notion_party', '🏆': 'notion_party', '🎖️': 'notion_party', '🏅': 'notion_party', '🥇': 'notion_party', '🥈': 'notion_party', '🥉': 'notion_party',
  
  // Work / Tech / Code
  '💻': 'notion_work', '🖥️': 'notion_work', '⌨️': 'notion_work', '🖱️': 'notion_work', '💾': 'notion_work', '💿': 'notion_work', '📀': 'notion_work', '📱': 'notion_work', '⚙️': 'notion_work', '🔧': 'notion_work', '🔨': 'notion_work', '🛠️': 'notion_work',
  
  // Happy / Smileys
  '😀': 'notion_happy', '😃': 'notion_happy', '😄': 'notion_happy', '😁': 'notion_happy', '😆': 'notion_happy', '😅': 'notion_happy', '🤣': 'notion_happy', '😂': 'notion_happy', '🙂': 'notion_happy', '😊': 'notion_happy', '😇': 'notion_happy', '🥰': 'notion_happy', '😍': 'notion_happy', '😘': 'notion_happy', '😗': 'notion_happy', '😙': 'notion_happy', '😚': 'notion_happy', '😋': 'notion_happy', '😜': 'notion_happy', '🤪': 'notion_happy', '😛': 'notion_happy', '🤑': 'notion_happy', '🤗': 'notion_happy', '🫣': 'notion_happy', '🤭': 'notion_happy', '🫡': 'notion_happy', '🤫': 'notion_happy', '🤔': 'notion_happy', '🫠': 'notion_happy', '🕶️': 'notion_happy', '😎': 'notion_happy', '☑': 'notion_happy',
  
  // Image / Other emojis in slash commands
  '🖼️': 'notion_page', '📑': 'notion_page',
};

interface NotionIconProps {
  icon?: string;
  className?: string;
  style?: React.CSSProperties;
  size?: number | string;
}

export function NotionIcon({ icon, className = '', style = {}, size = '1.2em' }: NotionIconProps) {
  if (!icon) return null;

  const isDoodle = icon.startsWith('notion_') || EMOJI_MAP[icon];

  if (!isDoodle) {
    // If it's a short text symbol (e.g. Aa, H₁, •, 1., ▸, —, ⊞, etc.), render it as text!
    if (icon.length <= 3) {
      return (
        <span className={className} style={{
          fontSize: '1em',
          fontWeight: 600,
          display: 'inline-block',
          verticalAlign: 'middle',
          lineHeight: 1,
          ...style
        }}>
          {icon}
        </span>
      );
    }
  }

  // Determine key
  const imageKey = icon.startsWith('notion_') ? icon : (EMOJI_MAP[icon] || 'notion_page');
  const src = NOTION_IMAGES[imageKey] || notionPage;
  const dimensions = typeof size === 'number' ? `${size}px` : size;


  // Modern CSS mix-blend-mode: multiply in light mode allows transparent white background.
  // In dark mode, we invert the image colors (so black ink becomes white) and mix-blend-mode: screen (transparent black background).
  // The system's dark class is applied to documentElement.
  const mergedStyle: React.CSSProperties = {
    width: dimensions,
    height: dimensions,
    display: 'inline-block',
    verticalAlign: 'middle',
    objectFit: 'contain',
    ...style,
  };

  return (
    <img
      src={src}
      alt={imageKey}
      className={`notion-icon-doodle ${className}`}
      style={mergedStyle}
    />
  );
}

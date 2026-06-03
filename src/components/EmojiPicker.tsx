import { useState, useMemo } from 'react';

const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Smileys': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','😘','😗','😙','😚','😋','😜','🤪','😛','🤑','🤗','🫣','🤭','🫡','🤫','🤔','🫠','🤐','😶','😑','😬','🙄','😯','😮','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕'],
  'People': ['👋','🤚','✋','🖖','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🫀','🫁','🧠','🦷','🦴','👀','👁️','👅','👄','🫦','💋'],
  'Animals': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪲','🦟','🦗','🪰','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🦭','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🫎','🦙','🐏','🐑','🐐','🦌'],
  'Food': ['🍎','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫛','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥮','🍢','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯'],
  'Activities': ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','⛹️','🤺','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎫','🎟️','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻','🪈','🎲','♟️','🎯','🎳','🪀','🪁','🎮','🕹️'],
  'Travel': ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍️','🛵','🛺','🚲','🛴','🛹','🛼','🚏','🛣️','🛤️','⛽','🛞','🚨','🚥','🚦','🛑','🚧','⚓','🛟','⛵','🛶','🚤','🛳️','⛴️','🛥️','🚢','✈️','🛩️','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰️','🚀','🛸','🪐','🌍','🌎','🌏','🧭','⛰️','🏔️','🌋','🗻','🏕️','🏖️','🏜️','🏝️','🏞️','🏟️','🏛️','🏗️','🧱','🏘️','🏚️','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽','⛪','🕌','🛕','🕍','⛩️'],
  'Objects': ['⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','💽','💾','💿','📀','🧮','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🪫','🔌','💡','🔦','🕯️','🪔','🧯','🗑️','🔧','🪛','🔨','⚒️','🛠️','⛏️','🪝','🔩','⚙️','🗜️','🔗','⛓️','🪤','🧲','🔫','💣','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','🪬','💈','⚗️','🔭','🔬','🕳️','🩹','🩺','🩻','🪒','🧴','🧷','🧹','🧺','🧻','🪣','🧼','🪥','🧽','🪤','🧯','🛒'],
  'Symbols': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','🛐','🔯','🕎','☯️','☦️','🔱','⚜️','🔰','♻️','🆚','💠','🌀','🔵','⚫','⚪','🟤','🔴','🟠','🟡','🟢','🔷','🔶','🔹','🔸','♦️','🔺','🔻','💯','🔔','🔕','🔇','🔈','📣','📢','💬','💭','🗯️','♠️','♣️','♥️','♦️','🃏','🀄'],
  'Nature': ['🌸','🌼','🌻','🌺','🌹','🥀','🪷','🌷','🌱','🪴','🌲','🌳','🌴','🌵','🎄','🌾','🍀','☘️','🍁','🍂','🍃','🪺','🍄','🌰','🐚','🪸','🪨','🌙','☀️','🌤️','⛅','🌥️','☁️','🌦️','🌧️','⛈️','🌩️','🌨️','❄️','☃️','⛄','🌬️','💨','🌪️','🌫️','🌊','🌈','☔','⚡','🌟','✨','💫','⭐','🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘','🌙','🌚','🌛','🌜','🌝','🌞'],
};

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  onRemove?: () => void;
}

export function EmojiPicker({ onSelect, onClose, onRemove }: Props) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Smileys');

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return EMOJI_CATEGORIES[category] ?? [];
    const q = search.toLowerCase();
    return Object.values(EMOJI_CATEGORIES).flat().filter((e) =>
      e.includes(q) || Object.entries(EMOJI_CATEGORIES).some(
        ([cat, emojis]) => emojis.includes(e) && cat.toLowerCase().includes(q)
      )
    ).slice(0, 64);
  }, [search, category]);

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={onClose} />
      <div className="emoji-picker" style={{ position: 'relative', zIndex: 50 }}>
        <input
          className="emoji-picker-search"
          placeholder="Search emoji..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />

        {!search && (
          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginBottom: 8 }}>
            {Object.keys(EMOJI_CATEGORIES).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  cursor: 'pointer',
                  background: cat === category ? 'var(--bg-hover-strong)' : 'transparent',
                  color: cat === category ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: cat === category ? 600 : 400,
                  transition: 'background 150ms',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {!search && <div className="emoji-picker-label">{category}</div>}
        {search && filteredEmojis.length === 0 && (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No emoji found
          </div>
        )}

        <div className="emoji-grid">
          {filteredEmojis.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              className="emoji-btn"
              onClick={() => onSelect(emoji)}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="emoji-picker-actions">
          {onRemove && (
            <button className="emoji-picker-action" onClick={onRemove}>
              Remove
            </button>
          )}
          <button className="emoji-picker-action" onClick={onClose} style={{ marginLeft: 'auto' }}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

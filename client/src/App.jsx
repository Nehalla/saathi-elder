import { useState, useEffect, useRef } from 'react';
import { translations } from './translations';
import './App.css';

export default function App() {
  // Application State
  const [lang, setLang] = useState('or'); // 'or' | 'hi' | 'en'
  const [fontSize, setFontSize] = useState('large'); // 'normal' | 'large' | 'xlarge'
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'reminders' | 'contacts' | 'wellbeing' | 'system'

  // Chat State
  const [messages, setMessages] = useState([
    {
      id: 'm-welcome',
      sender: 'saathi',
      text: 'ନମସ୍କାର ଆଜ୍ଞା! ମୁଁ "ସାଥୀ", ଆପଣଙ୍କ ଦୈନନ୍ଦିନ ସହାୟକ। ଆଜି ଆପଣ କିପରି ଅନୁଭବ କରୁଛନ୍ତି? ଆପଣଙ୍କୁ କୌଣସି ଔଷଧ ସମୟ, ଡାକ୍ତର ଅପଏଣ୍ଟମେଣ୍ଟ କିମ୍ବା ପରିବାର ସହ କଥା ହେବାରେ ସାହାଯ୍ୟ ଦରକାର କି?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      provider: 'saathi-assistant'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speechNotice, setSpeechNotice] = useState(null);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  // Reminders State
  const [reminders, setReminders] = useState([]);
  const [reminderFilter, setReminderFilter] = useState('all'); // 'all' | 'medication' | 'appointment'
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({
    type: 'medication',
    title: '',
    time: '08:30 AM',
    meal: 'After breakfast',
    date: '',
    location: '',
    notes: ''
  });
  const [reminderLoading, setReminderLoading] = useState(false);

  // Contacts & SOS State
  const [contacts, setContacts] = useState([]);
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosActionFeedback, setSosActionFeedback] = useState(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: 'Family Member',
    isPrimary: false
  });

  // Wellbeing State
  const [wellbeing, setWellbeing] = useState({
    todayMood: 'good',
    waterGlasses: 4,
    lastCheckIn: '',
    stepCountDemo: 6240,
    dailyQuote: {
      or: 'ପ୍ରତିଦିନ ସକାଳେ ଅଳ୍ପ ଚାଲିବା ଏବଂ ପ୍ରଚୁର ପାଣି ପିଇବା ସ୍ୱାସ୍ଥ୍ୟ ପାଇଁ ଅତ୍ୟନ୍ତ ଉପକାରୀ।',
      hi: 'रोज सुबह थोड़ा टहलना और भरपूर पानी पीना सेहत के लिए वरदान है।',
      en: 'A gentle morning stroll and staying hydrated brings vitality and peaceful sleep.'
    }
  });
  const [moodFeedback, setMoodFeedback] = useState(null);

  // System & Health State
  const [systemHealth, setSystemHealth] = useState(null);
  const [lastLiveAiStatus, setLastLiveAiStatus] = useState(null);

  // Audio Speech Recognition Ref
  const recognitionRef = useRef(null);
  const chatScrollRef = useRef(null);

  const t = translations[lang] || translations.or;

  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isChatLoading]);

  // Initial Fetch: Health, Reminders, Contacts, Wellbeing
  useEffect(() => {
    fetchHealth();
    fetchReminders();
    fetchContacts();
    fetchWellbeing();
  }, []);

  // Update initial welcome message when language changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'm-welcome') {
      const welcomeTexts = {
        or: 'ନମସ୍କାର ଆଜ୍ଞା! ମୁଁ "ସାଥୀ", ଆପଣଙ୍କ ଦୈନନ୍ଦିନ ସହାୟକ। ଆଜି ଆପଣ କିପରି ଅନୁଭବ କରୁଛନ୍ତି? ଆପଣଙ୍କୁ କୌଣସି ଔଷଧ ସମୟ, ଡାକ୍ତର ଅପଏଣ୍ଟମେଣ୍ଟ କିମ୍ବା ପରିବାର ସହ କଥା ହେବାରେ ସାହାଯ୍ୟ ଦରକାର କି?',
        hi: 'नमस्ते जी! मैं "साथी", आपका अपना दैनिक सहायक। आज आप कैसा महसूस कर रहे हैं? क्या आज आपकी दवाई का समय हो गया है या किसी से बात करनी है?',
        en: 'Hello! I am "Saathi", your caring daily companion. How are you feeling today? Would you like me to check your medications, doctor appointments, or reach family?'
      };
      setMessages([
        {
          id: 'm-welcome',
          sender: 'saathi',
          text: welcomeTexts[lang] || welcomeTexts.or,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider: 'saathi-assistant'
        }
      ]);
    }
  }, [lang]);

  // Fetch Health
  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setSystemHealth(data);
      }
    } catch (err) {
      console.warn('Backend health check warning:', err.message);
    }
  };

  // Fetch Reminders
  const fetchReminders = async () => {
    setReminderLoading(true);
    try {
      const res = await fetch('/api/reminders');
      if (res.ok) {
        const data = await res.json();
        setReminders(data.reminders || []);
      }
    } catch (err) {
      console.warn('Fetch reminders failed:', err.message);
    } finally {
      setReminderLoading(false);
    }
  };

  // Fetch Contacts
  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.warn('Fetch contacts failed:', err.message);
    }
  };

  // Fetch Wellbeing
  const fetchWellbeing = async () => {
    try {
      const res = await fetch('/api/wellbeing');
      if (res.ok) {
        const data = await res.json();
        setWellbeing(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn('Fetch wellbeing failed:', err.message);
    }
  };

  // -----------------------------------------------------------
  // Priority 1: Send Message to Chat
  // -----------------------------------------------------------
  const handleSendMessage = async (customText = null) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isChatLoading) return;

    const userMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsChatLoading(true);
    setChatError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          language: lang,
          conversationHistory: messages.slice(-4)
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setLastLiveAiStatus({
        isLiveAI: data.isLiveAI,
        provider: data.provider,
        notice: data.keyNotice
      });

      // Synchronize reminder state immediately if created via chat
      if (data.reminderCreated && data.reminder) {
        setReminders(prev => [data.reminder, ...prev.filter(r => r.id !== data.reminder.id)]);
      }

      const saathiResponse = {
        id: `s-${Date.now()}`,
        sender: 'saathi',
        text: data.response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: data.provider,
        isLiveAI: data.isLiveAI,
        keyNotice: data.keyNotice,
        createdReminder: data.reminderCreated ? data.reminder : null
      };

      setMessages(prev => [...prev, saathiResponse]);

      // Automatically announce audio if browser supports it
      speakText(data.response, saathiResponse.id);
    } catch (err) {
      setChatError(err.message || 'Unable to connect to Saathi. Please try again.');
    } finally {
      setIsChatLoading(false);
    }
  };

  // -----------------------------------------------------------
  // Priority 2: Voice Recognition (Mic)
  // -----------------------------------------------------------
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechNotice('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    try {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;

      // Map language
      const langCodes = {
        or: 'or-IN',
        hi: 'hi-IN',
        en: 'en-IN'
      };
      recognition.lang = langCodes[lang] || 'or-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechNotice(null);
      };

      recognition.onresult = (event) => {
        const spoken = event.results?.[0]?.[0]?.transcript;
        if (spoken) {
          setInputMessage(spoken);
          handleSendMessage(spoken);
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechNotice('Microphone access was denied. Please allow microphone permissions in browser settings.');
        } else {
          setSpeechNotice(`Voice error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      setSpeechNotice(err.message);
    }
  };

  // -----------------------------------------------------------
  // Priority 2: Text-To-Speech (Listen / Read Aloud)
  // -----------------------------------------------------------
  const speakText = async (text, msgId) => {
    // If already speaking this message, stop it
    if (speakingMsgId === msgId) {
      stopSpeaking();
      return;
    }

    // First attempt Sarvam TTS via backend if configured
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: lang })
      });
      const data = await res.json();

      if (data.supported && data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        setSpeakingMsgId(msgId);
        audio.play();
        audio.onended = () => setSpeakingMsgId(null);
        return;
      }
    } catch (e) {
      console.warn('Sarvam backend audio skipped, falling back to browser speech:', e.message);
    }

    // Native Browser Web Speech Fallback
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const langCodes = { or: 'hi-IN', hi: 'hi-IN', en: 'en-US' }; // Odia fallback to hi-IN for TTS phonetics
      utterance.lang = langCodes[lang] || 'hi-IN';
      utterance.rate = 0.9; // Slightly slower, respectful elder pace
      utterance.pitch = 1.0;

      utterance.onstart = () => setSpeakingMsgId(msgId);
      utterance.onend = () => setSpeakingMsgId(null);
      utterance.onerror = () => setSpeakingMsgId(null);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
  };

  // -----------------------------------------------------------
  // Priority 3: Reminders Handlers
  // -----------------------------------------------------------
  const toggleReminderComplete = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus })
      });
      if (res.ok) {
        setReminders(prev =>
          prev.map(r => (r.id === id ? { ...r, completed: !currentStatus } : r))
        );
      }
    } catch (err) {
      console.error('Toggle reminder error:', err);
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!newReminder.title.trim()) return;

    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReminder)
      });
      if (res.ok) {
        const data = await res.json();
        setReminders(prev => [data.reminder, ...prev]);
        setIsAddingReminder(false);
        setNewReminder({
          type: 'medication',
          title: '',
          time: '08:30 AM',
          meal: 'After breakfast',
          date: '',
          location: '',
          notes: ''
        });
      }
    } catch (err) {
      console.error('Add reminder error:', err);
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReminders(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Delete reminder error:', err);
    }
  };

  // -----------------------------------------------------------
  // Priority 4: Contacts & SOS Handlers
  // -----------------------------------------------------------
  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContact.name.trim() || !newContact.phone.trim()) return;

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(prev => [...prev, data.contact]);
        setIsAddingContact(false);
        setNewContact({ name: '', phone: '', relationship: 'Family Member', isPrimary: false });
      }
    } catch (err) {
      console.error('Add contact error:', err);
    }
  };

  const primaryContact = contacts.find(c => c.isPrimary) || contacts[0] || {
    name: 'Rajesh (Caregiver)',
    phone: '+919861012345'
  };

  const triggerSosCall = (phone) => {
    setShowSosModal(false);
    setSosActionFeedback(`Initiated telephone call to ${phone} at ${new Date().toLocaleTimeString()}`);
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  };

  const triggerSosMessage = (contact) => {
    setShowSosModal(false);
    const msg = encodeURIComponent(
      `🚨 EMERGENCY ALERT: This is an emergency check-in from Saathi AI. I require immediate assistance. Please call me back right now.`
    );
    const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${msg}`;
    setSosActionFeedback(`Prepared emergency alert message for ${contact.name}. WhatsApp/SMS ready.`);
    window.open(waUrl, '_blank');
  };

  // -----------------------------------------------------------
  // Priority 5: Wellbeing Handlers
  // -----------------------------------------------------------
  const handleMoodSelect = async (mood) => {
    try {
      const res = await fetch('/api/wellbeing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todayMood: mood })
      });
      if (res.ok) {
        const data = await res.json();
        setWellbeing(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn('Update mood warning:', err);
    }

    const messagesByMood = {
      great: {
        or: 'ଆପଣ ଖୁବ୍ ଭଲ ଅନୁଭବ କରୁଛନ୍ତି ଜାଣି ମନ ଆନନ୍ଦିତ ହେଲା! ଆଜିର ଦିନ ଆପଣଙ୍କ ପାଇଁ ଶାନ୍ତିପୂର୍ଣ୍ଣ ରହୁ।',
        hi: 'यह जानकर बहुत खुशी हुई कि आप बहुत अच्छा महसूस कर रहे हैं! आपका दिन शुभ और सुखद हो।',
        en: 'Delighted to hear you are feeling wonderful! May your day be peaceful and full of joy.'
      },
      okay: {
        or: 'ଆପଣ ଠିକ୍ ଅଛନ୍ତି। ନିୟମିତ ପାଣି ପିଅନ୍ତୁ ଏବଂ କିଛି ସମୟ ଶାନ୍ତ ଭାବରେ ବିଶ୍ରାମ ନିଅନ୍ତୁ।',
        hi: 'आप ठीक हैं, यह अच्छी बात है। थोड़ा पानी पिएं और कुछ समय शांति से आराम करें।',
        en: 'Glad you are doing fine. Remember to sip some water and rest peacefully.'
      },
      tired: {
        or: 'ଆପଣ ଥକା ଅନୁଭବ କରୁଛନ୍ତି କି? ଦୟାକରି କିଛି ସମୟ ଶୋଇ ବିଶ୍ରାମ ନିଅନ୍ତୁ କିମ୍ବା ପୁଅ/ଝିଅଙ୍କ ସହ କଥା ହୁଅନ୍ତୁ।',
        hi: 'क्या आपको थकान लग रही है? कृपया थोड़ी देर आराम करें या परिवार में किसी से बात कर लें।',
        en: 'Feeling tired? Please take a gentle rest, hydrate, or reach out to your loved ones.'
      }
    };
    setMoodFeedback(messagesByMood[mood]?.[lang] || messagesByMood[mood]?.or);
  };

  const handleWaterChange = async (delta) => {
    const updatedCount = Math.max(0, (wellbeing.waterGlasses || 0) + delta);
    try {
      const res = await fetch('/api/wellbeing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waterGlasses: updatedCount })
      });
      if (res.ok) {
        const data = await res.json();
        setWellbeing(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn('Water update warning:', err);
    }
  };

  // Filtered Reminders
  const filteredReminders = reminders.filter(r => {
    if (reminderFilter === 'all') return true;
    return r.type === reminderFilter;
  });

  return (
    <div className={`app-container font-size-${fontSize}`}>
      {/* ----------------- UPPER BRAND HEADER ----------------- */}
      <header className="brand-header">
        <div className="brand-top-row">
          <div className="brand-identity">
            <img
              src="/GDG_Logo.jpg"
              alt="GDG Logo"
              className="gdg-logo-mark"
            />
            <div className="brand-titles">
              <h1 className="brand-heading">
                {t.brandName} <span className="brand-script">(ସାଥୀ / साथी)</span>
              </h1>
              <p className="brand-tagline">{t.tagline}</p>
            </div>
          </div>

          {/* Controls: Language & Font Size */}
          <div className="header-controls">
            {/* Language Switcher */}
            <div className="control-group" aria-label="Language selector">
              <span className="control-label">🌐 ଭାଷା / भाषा:</span>
              <div className="segmented-buttons">
                <button
                  className={`btn-segment ${lang === 'or' ? 'active' : ''}`}
                  onClick={() => setLang('or')}
                >
                  ଓଡ଼ିଆ
                </button>
                <button
                  className={`btn-segment ${lang === 'hi' ? 'active' : ''}`}
                  onClick={() => setLang('hi')}
                >
                  हिन्दी
                </button>
                <button
                  className={`btn-segment ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => setLang('en')}
                >
                  English
                </button>
              </div>
            </div>

            {/* Font Size Selector */}
            <div className="control-group" aria-label="Font size selector">
              <span className="control-label">{t.fontSizeTitle}</span>
              <div className="segmented-buttons">
                <button
                  className={`btn-segment ${fontSize === 'normal' ? 'active' : ''}`}
                  onClick={() => setFontSize('normal')}
                  title="Normal font size"
                >
                  A
                </button>
                <button
                  className={`btn-segment ${fontSize === 'large' ? 'active' : ''}`}
                  onClick={() => setFontSize('large')}
                  title="Large font size"
                >
                  A+
                </button>
                <button
                  className={`btn-segment ${fontSize === 'xlarge' ? 'active' : ''}`}
                  onClick={() => setFontSize('xlarge')}
                  title="Extra large font size"
                >
                  A++
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Medical & Safety Disclaimer Banner */}
        <div className="safety-disclaimer-banner">
          <span className="disclaimer-icon">🛡️</span>
          <p className="disclaimer-text">{t.medicalDisclaimer}</p>
        </div>
      </header>

      {/* ----------------- MAIN NAVIGATION TABS ----------------- */}
      <nav className="main-nav-tabs" aria-label="Primary Navigation">
        <button
          className={`nav-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          {t.tabChat}
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'reminders' ? 'active' : ''}`}
          onClick={() => setActiveTab('reminders')}
        >
          {t.tabReminders}
          {reminders.filter(r => !r.completed).length > 0 && (
            <span className="nav-badge">
              {reminders.filter(r => !r.completed).length}
            </span>
          )}
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          {t.tabContacts}
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'wellbeing' ? 'active' : ''}`}
          onClick={() => setActiveTab('wellbeing')}
        >
          {t.tabWellbeing}
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          {t.tabSystem}
        </button>
      </nav>

      {/* ----------------- TAB 1: AI COMPANION (CHAT) ----------------- */}
      {activeTab === 'chat' && (
        <section className="tab-section chat-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">{t.chatTitle}</h2>
              <p className="section-subtitle">{t.chatSubtitle}</p>
            </div>
            {/* Live AI Status pill */}
            <div className="ai-status-indicator">
              {systemHealth?.aiStatus?.geminiConfigured ? (
                <span className="status-pill status-live">
                  ⚡ Gemini Flash Live AI Connected
                </span>
              ) : (
                <span className="status-pill status-preview" title="Add GEMINI_API_KEY in server/.env for live model">
                  ℹ️ Saathi Assistant Mode (Preview)
                </span>
              )}
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="quick-suggestions-block">
            <span className="suggestions-prompt-label">{t.suggestionsLabel}</span>
            <div className="suggestion-chips">
              {t.suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  className="chip-btn"
                  onClick={() => handleSendMessage(suggestion)}
                  disabled={isChatLoading}
                >
                  💬 {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Container */}
          <div className="chat-messages-container" ref={chatScrollRef}>
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`message-bubble-wrapper ${
                  msg.sender === 'user' ? 'bubble-user' : 'bubble-saathi'
                }`}
              >
                <div className="bubble-avatar">
                  {msg.sender === 'user' ? '👤' : '🌸'}
                </div>
                <div className="bubble-content-card">
                  <div className="bubble-meta">
                    <span className="bubble-author">
                      {msg.sender === 'user' ? 'ଆପଣ / You' : 'ସାଥୀ (Saathi)'}
                    </span>
                    <span className="bubble-time">{msg.time}</span>
                  </div>

                  <p className="bubble-text">{msg.text}</p>

                  {/* Synchronized Reminder Confirmation Card */}
                  {msg.createdReminder && (
                    <div className="chat-reminder-action-card">
                      <div className="action-card-header">
                        <span className="action-card-badge">
                          {msg.createdReminder.type === 'medication' ? '💊 ' + t.formTypeMed : '👨‍⚕️ ' + t.formTypeAppt}
                        </span>
                        <span className="action-card-time">⏰ {msg.createdReminder.time}</span>
                      </div>
                      <h4 className="action-card-title">{msg.createdReminder.title}</h4>
                      {msg.createdReminder.meal && (
                        <p className="action-card-meal">🥄 {msg.createdReminder.meal}</p>
                      )}
                      <button
                        type="button"
                        className="btn-view-reminders"
                        onClick={() => setActiveTab('reminders')}
                      >
                        {lang === 'or'
                          ? 'ଔଷଧ ତାଲିକାରେ ଦେଖନ୍ତୁ'
                          : lang === 'hi'
                          ? 'दवाई सूची में देखें'
                          : 'View in Reminders'}{' '}
                        →
                      </button>
                    </div>
                  )}

                  {/* Read Aloud button on Saathi messages */}
                  {msg.sender === 'saathi' && (
                    <div className="bubble-actions">
                      <button
                        className={`btn-audio-speak ${
                          speakingMsgId === msg.id ? 'btn-speaking-active' : ''
                        }`}
                        onClick={() => speakText(msg.text, msg.id)}
                        aria-label="Read message aloud"
                      >
                        {speakingMsgId === msg.id ? t.stopAudio : t.listenAudio}
                      </button>
                    </div>
                  )}

                  {msg.keyNotice && (
                    <div className="bubble-disclaimer-note">
                      ℹ️ {msg.keyNotice}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="message-bubble-wrapper bubble-saathi">
                <div className="bubble-avatar">🌸</div>
                <div className="bubble-content-card bubble-loading">
                  <span className="spinner"></span>
                  <span className="loading-text">{t.thinking}</span>
                </div>
              </div>
            )}

            {chatError && (
              <div className="chat-error-banner">
                <strong>ଅସୁବିଧା:</strong> {chatError}
                <button
                  className="btn-retry"
                  onClick={() => handleSendMessage(inputMessage)}
                >
                  ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ
                </button>
              </div>
            )}
          </div>

          {/* Speech / Mic Notice */}
          {speechNotice && (
            <div className="speech-notice-alert">
              <span>⚠️ {speechNotice}</span>
              <button
                className="btn-close-notice"
                onClick={() => setSpeechNotice(null)}
              >
                ✕
              </button>
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            className="chat-input-bar"
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <button
              type="button"
              className={`btn-mic-record ${isListening ? 'listening-pulse' : ''}`}
              onClick={startSpeechRecognition}
              title={t.speakingButton}
              aria-label={t.speakingButton}
            >
              🎤
            </button>

            <input
              type="text"
              id="chatMessageInput"
              name="chatMessage"
              className="chat-text-input"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder={isListening ? t.listeningState : t.chatPlaceholder}
              disabled={isChatLoading}
              aria-label={t.chatPlaceholder}
            />

            <button
              type="submit"
              className="btn-chat-send"
              disabled={isChatLoading || !inputMessage.trim()}
            >
              {isChatLoading ? '...' : t.sendButton}
            </button>
          </form>
        </section>
      )}

      {/* ----------------- TAB 2: REMINDERS & APPOINTMENTS ----------------- */}
      {activeTab === 'reminders' && (
        <section className="tab-section reminders-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">{t.remindersTitle}</h2>
              <p className="section-subtitle">{t.remindersSubtitle}</p>
            </div>
            <button
              className="btn-add-primary"
              onClick={() => setIsAddingReminder(!isAddingReminder)}
            >
              {isAddingReminder ? t.cancelButton : `➕ ${t.addNewReminder}`}
            </button>
          </div>

          {/* Add Reminder Form Modal / Expander */}
          {isAddingReminder && (
            <form className="add-reminder-form" onSubmit={handleAddReminder}>
              <h3 className="form-legend">➕ {t.addNewReminder}</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label>{t.formType}</label>
                  <select
                    value={newReminder.type}
                    onChange={e =>
                      setNewReminder({ ...newReminder, type: e.target.value })
                    }
                  >
                    <option value="medication">{t.formTypeMed}</option>
                    <option value="appointment">{t.formTypeAppt}</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>{t.formTitle} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Blood Pressure Tablet / ହୃଦରୋଗ ପରାମର୍ଶ"
                    value={newReminder.title}
                    onChange={e =>
                      setNewReminder({ ...newReminder, title: e.target.value })
                    }
                  />
                </div>

                <div className="form-field">
                  <label>{t.formTime} *</label>
                  <input
                    type="text"
                    required
                    placeholder="08:30 AM"
                    value={newReminder.time}
                    onChange={e =>
                      setNewReminder({ ...newReminder, time: e.target.value })
                    }
                  />
                </div>

                {newReminder.type === 'medication' ? (
                  <div className="form-field">
                    <label>{t.formMeal}</label>
                    <input
                      type="text"
                      placeholder="e.g. After breakfast / ଜଳଖିଆ ପରେ"
                      value={newReminder.meal}
                      onChange={e =>
                        setNewReminder({ ...newReminder, meal: e.target.value })
                      }
                    />
                  </div>
                ) : (
                  <>
                    <div className="form-field">
                      <label>{t.formDate}</label>
                      <input
                        type="date"
                        value={newReminder.date}
                        onChange={e =>
                          setNewReminder({ ...newReminder, date: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label>{t.formLocation}</label>
                      <input
                        type="text"
                        placeholder="Clinic Name, City"
                        value={newReminder.location}
                        onChange={e =>
                          setNewReminder({
                            ...newReminder,
                            location: e.target.value
                          })
                        }
                      />
                    </div>
                  </>
                )}

                <div className="form-field full-width">
                  <label>{t.formNotes}</label>
                  <input
                    type="text"
                    placeholder="Important notes, dosage, or reports to carry"
                    value={newReminder.notes}
                    onChange={e =>
                      setNewReminder({ ...newReminder, notes: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save-reminder">
                  {t.saveButton}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsAddingReminder(false)}
                >
                  {t.cancelButton}
                </button>
              </div>
            </form>
          )}

          {/* Filter Pills */}
          <div className="filter-pills-bar">
            <button
              className={`pill-btn ${reminderFilter === 'all' ? 'active' : ''}`}
              onClick={() => setReminderFilter('all')}
            >
              {t.filterAll} ({reminders.length})
            </button>
            <button
              className={`pill-btn ${
                reminderFilter === 'medication' ? 'active' : ''
              }`}
              onClick={() => setReminderFilter('medication')}
            >
              {t.filterMeds} (
              {reminders.filter(r => r.type === 'medication').length})
            </button>
            <button
              className={`pill-btn ${
                reminderFilter === 'appointment' ? 'active' : ''
              }`}
              onClick={() => setReminderFilter('appointment')}
            >
              {t.filterAppts} (
              {reminders.filter(r => r.type === 'appointment').length})
            </button>
          </div>

          {/* Reminders List */}
          <div className="reminders-list">
            {filteredReminders.length === 0 ? (
              <div className="empty-state-card">
                <span className="empty-icon">📝</span>
                <p>{t.emptyReminders}</p>
              </div>
            ) : (
              filteredReminders.map(rem => (
                <div
                  key={rem.id}
                  className={`reminder-card ${
                    rem.completed ? 'reminder-done' : ''
                  }`}
                >
                  <div className="reminder-left">
                    <span className="reminder-type-tag">
                      {rem.type === 'medication' ? `💊 ${t.formTypeMed}` : `👨‍⚕️ ${t.formTypeAppt}`}
                    </span>
                    <span className="reminder-time-badge">⏰ {rem.time}</span>
                  </div>

                  <div className="reminder-body">
                    <h3 className="reminder-title">
                      {lang === 'or' && rem.title_or
                        ? rem.title_or
                        : lang === 'hi' && rem.title_hi
                        ? rem.title_hi
                        : rem.title}
                    </h3>

                    {rem.meal && (
                      <p className="reminder-detail">
                        <strong>{t.instructionLabel}</strong> {rem.meal}
                      </p>
                    )}

                    {rem.location && (
                      <p className="reminder-detail">
                        <strong>{t.locationLabel}</strong> {rem.location}
                      </p>
                    )}

                    {rem.date && (
                      <p className="reminder-detail">
                        <strong>{t.dateLabel}</strong> {rem.date}
                      </p>
                    )}

                    {rem.notes && (
                      <p className="reminder-notes">📝 {rem.notes}</p>
                    )}
                  </div>

                  <div className="reminder-actions">
                    <button
                      className={`btn-complete-toggle ${
                        rem.completed ? 'is-completed' : ''
                      }`}
                      onClick={() =>
                        toggleReminderComplete(rem.id, rem.completed)
                      }
                    >
                      {rem.completed ? '✓ ' + t.completedBadge : '⭕ ' + t.markCompleted}
                    </button>
                    <button
                      className="btn-delete-reminder"
                      onClick={() => handleDeleteReminder(rem.id)}
                      title="Delete reminder"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="reminders-footer-notice">
            <span>ℹ️ {t.remindersNotice}</span>
          </div>
        </section>
      )}

      {/* ----------------- TAB 3: CONTACTS & EMERGENCY SOS ----------------- */}
      {activeTab === 'contacts' && (
        <section className="tab-section contacts-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">{t.contactsTitle}</h2>
              <p className="section-subtitle">{t.contactsSubtitle}</p>
            </div>
            <button
              className="btn-add-primary"
              onClick={() => setIsAddingContact(!isAddingContact)}
            >
              {isAddingContact ? t.cancelButton : `➕ ${t.addContactBtn}`}
            </button>
          </div>

          {/* Prominent High-Contrast SOS Hero Banner */}
          <div className="sos-hero-card">
            <div className="sos-hero-content">
              <span className="sos-alert-badge">EMERGENCY ASSISTANCE</span>
              <h3 className="sos-hero-heading">{t.sosButton}</h3>
              <p className="sos-hero-desc">{t.sosNotice}</p>
            </div>
            <button
              className="btn-sos-trigger"
              onClick={() => setShowSosModal(true)}
            >
              🚨 SOS
            </button>
          </div>

          {/* Feedback Toast if action was triggered */}
          {sosActionFeedback && (
            <div className="sos-feedback-toast">
              <span>✅ {sosActionFeedback}</span>
              <button
                className="btn-close-notice"
                onClick={() => setSosActionFeedback(null)}
              >
                ✕
              </button>
            </div>
          )}

          {/* Add Contact Form */}
          {isAddingContact && (
            <form className="add-contact-form" onSubmit={handleAddContact}>
              <h3 className="form-legend">➕ {t.addContactBtn}</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label>{t.contactName} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh (Son)"
                    value={newContact.name}
                    onChange={e =>
                      setNewContact({ ...newContact, name: e.target.value })
                    }
                  />
                </div>
                <div className="form-field">
                  <label>{t.contactPhone} *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={newContact.phone}
                    onChange={e =>
                      setNewContact({ ...newContact, phone: e.target.value })
                    }
                  />
                </div>
                <div className="form-field">
                  <label>{t.contactRelation}</label>
                  <input
                    type="text"
                    placeholder="Caregiver, Daughter, Doctor"
                    value={newContact.relationship}
                    onChange={e =>
                      setNewContact({
                        ...newContact,
                        relationship: e.target.value
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-save-reminder">
                  {t.saveButton}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsAddingContact(false)}
                >
                  {t.cancelButton}
                </button>
              </div>
            </form>
          )}

          {/* Contacts Cards */}
          <div className="contacts-grid">
            {contacts.map(c => (
              <div
                key={c.id}
                className={`contact-card ${c.isPrimary ? 'primary-contact' : ''}`}
              >
                <div className="contact-card-header">
                  <div className="contact-avatar-box">
                    {c.isPrimary ? '⭐' : '📞'}
                  </div>
                  <div>
                    <h3 className="contact-name">
                      {lang === 'or' && c.name_or
                        ? c.name_or
                        : lang === 'hi' && c.name_hi
                        ? c.name_hi
                        : c.name}
                    </h3>
                    <p className="contact-role">
                      {c.isPrimary ? t.primaryContactBadge : c.relationship}
                    </p>
                  </div>
                </div>

                <div className="contact-phone-display">
                  <span>{c.phone}</span>
                </div>

                <div className="contact-card-actions">
                  <a
                    href={`tel:${c.phone.replace(/\s+/g, '')}`}
                    className="btn-call-direct"
                    onClick={() =>
                      setSosActionFeedback(`Calling ${c.name} (${c.phone})...`)
                    }
                  >
                    📞 {t.callButton}
                  </a>

                  {c.notifyOnSOS && (
                    <button
                      className="btn-quick-sos-msg"
                      onClick={() => triggerSosMessage(c)}
                      title="Send WhatsApp emergency message"
                    >
                      💬 WhatsApp SOS
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 2-Step Emergency SOS Confirmation Modal */}
          {showSosModal && (
            <div className="modal-backdrop">
              <div className="sos-modal-card">
                <div className="sos-modal-header">
                  <span className="modal-warning-icon">🚨</span>
                  <h3>{t.sosModalTitle}</h3>
                </div>
                <p className="sos-modal-desc">{t.sosModalText}</p>

                <div className="sos-modal-options">
                  <button
                    className="btn-sos-option primary-call"
                    onClick={() => triggerSosCall(primaryContact.phone)}
                  >
                    {t.sosConfirmCall} ({primaryContact.name})
                  </button>

                  <button
                    className="btn-sos-option ambulance-call"
                    onClick={() => triggerSosCall('112')}
                  >
                    {t.sosCallAmbulance}
                  </button>

                  <button
                    className="btn-sos-option send-msg"
                    onClick={() => triggerSosMessage(primaryContact)}
                  >
                    {t.sosSendMsg}
                  </button>

                  <button
                    className="btn-sos-modal-cancel"
                    onClick={() => setShowSosModal(false)}
                  >
                    {t.sosCancel}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ----------------- TAB 4: DAILY WELLBEING ----------------- */}
      {activeTab === 'wellbeing' && (
        <section className="tab-section wellbeing-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">{t.wellbeingTitle}</h2>
              <p className="section-subtitle">{t.wellbeingSubtitle}</p>
            </div>
          </div>

          {/* Daily Mood Check-in Card */}
          <div className="wellbeing-card mood-checkin-card">
            <h3 className="card-heading">{t.moodQuestion}</h3>
            <div className="mood-buttons-grid">
              <button
                className={`btn-mood ${
                  wellbeing.todayMood === 'great' ? 'selected' : ''
                }`}
                onClick={() => handleMoodSelect('great')}
              >
                {t.moodGreat}
              </button>
              <button
                className={`btn-mood ${
                  wellbeing.todayMood === 'okay' ? 'selected' : ''
                }`}
                onClick={() => handleMoodSelect('okay')}
              >
                {t.moodOkay}
              </button>
              <button
                className={`btn-mood ${
                  wellbeing.todayMood === 'tired' ? 'selected' : ''
                }`}
                onClick={() => handleMoodSelect('tired')}
              >
                {t.moodTired}
              </button>
            </div>

            {moodFeedback && (
              <div className="mood-feedback-banner">
                <span className="feedback-star">🌸</span>
                <p>{moodFeedback}</p>
              </div>
            )}
          </div>

          <div className="wellbeing-grid-2col">
            {/* Hydration Tracker */}
            <div className="wellbeing-card hydration-card">
              <h3 className="card-heading">{t.hydrationTitle}</h3>
              <div className="hydration-display">
                <span className="hydration-number">
                  {wellbeing.waterGlasses || 0}
                </span>
                <span className="hydration-unit">{t.hydrationUnit}</span>
              </div>

              {/* Visual glasses */}
              <div className="water-glasses-row">
                {[...Array(8)].map((_, i) => (
                  <span
                    key={i}
                    className={`glass-icon ${
                      i < (wellbeing.waterGlasses || 0) ? 'filled' : 'empty'
                    }`}
                  >
                    💧
                  </span>
                ))}
              </div>
              <p className="hydration-goal">{t.hydrationGoal}</p>

              <div className="hydration-actions">
                <button
                  className="btn-water-inc"
                  onClick={() => handleWaterChange(1)}
                >
                  {t.addGlass}
                </button>
                <button
                  className="btn-water-dec"
                  onClick={() => handleWaterChange(-1)}
                  disabled={wellbeing.waterGlasses <= 0}
                >
                  {t.removeGlass}
                </button>
              </div>
            </div>

            {/* Daily Steps Tracker */}
            <div className="wellbeing-card step-counter-card">
              <h3 className="card-heading">{t.stepTitle}</h3>
              <div className="step-count-display">
                <span className="step-icon">🚶</span>
                <span className="step-number">
                  {wellbeing.stepCountDemo.toLocaleString()}
                </span>
                <span className="step-unit">steps</span>
              </div>
              <div className="step-progress-bar">
                <div
                  className="step-progress-fill"
                  style={{ width: '100%' }}
                ></div>
              </div>
              <p className="step-goal-text">{t.stepGoal}</p>
              <div className="sample-data-badge">
                <span>ℹ️ {t.stepDemoNote}</span>
              </div>
            </div>
          </div>

          {/* Daily Thought Card */}
          <div className="wellbeing-card daily-thought-card">
            <h3 className="card-heading">🌸 {t.dailyAdviceTitle}</h3>
            <p className="thought-quote">
              "{wellbeing.dailyQuote?.[lang] || wellbeing.dailyQuote?.or}"
            </p>
          </div>
        </section>
      )}

      {/* ----------------- TAB 5: SYSTEM & CONNECTIVITY ----------------- */}
      {activeTab === 'system' && (
        <section className="tab-section system-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">{t.systemTitle}</h2>
              <p className="section-subtitle">
                Backend architecture, API keys, and verified connectivity.
              </p>
            </div>
            <button className="btn-primary" onClick={fetchHealth}>
              🔄 Refresh Health
            </button>
          </div>

          <div className="system-grid">
            <div className="system-card">
              <h3>📡 Express Backend</h3>
              <p>
                Status:{' '}
                <strong className="badge-online">
                  {systemHealth ? 'Online & Healthy' : 'Checking...'}
                </strong>
              </p>
              <p>Port: <code>5000</code></p>
              <p>Uptime: {systemHealth?.uptimeHuman || 'N/A'}</p>
              <p>Started: {systemHealth?.startedAt || 'N/A'}</p>
            </div>

            <div className="system-card">
              <h3>🤖 Gemini AI Provider</h3>
              <p>
                Status:{' '}
                {systemHealth?.aiStatus?.geminiConfigured ? (
                  <strong className="badge-online">
                    Active (Gemini 1.5 Flash Key Configured)
                  </strong>
                ) : (
                  <strong className="badge-preview">
                    Preview Mode (Local Saathi Engine)
                  </strong>
                )}
              </p>
              <p className="system-hint">
                To connect live Gemini Flash, place <code>GEMINI_API_KEY</code> in{' '}
                <code>server/.env</code>.
              </p>
            </div>

            <div className="system-card">
              <h3>🎙️ Regional Voice (Sarvam & Browser)</h3>
              <p>
                Sarvam Cloud:{' '}
                {systemHealth?.aiStatus?.sarvamConfigured ? (
                  <strong className="badge-online">Connected (Bulbul v1)</strong>
                ) : (
                  <strong className="badge-preview">
                    Browser Native Web Speech (Active)
                  </strong>
                )}
              </p>
              <p className="system-hint">
                Microphone input & speech synthesis run natively in Chrome and Edge.
              </p>
            </div>

            <div className="system-card">
              <h3>💾 Local Data Persistence</h3>
              <p>
                Storage:{' '}
                <strong className="badge-online">
                  File-Backed JSON (server/data)
                </strong>
              </p>
              <p>Reminders stored: {reminders.length}</p>
              <p>Contacts stored: {contacts.length}</p>
            </div>
          </div>
        </section>
      )}

      {/* ----------------- ACCESSIBLE FOOTER ----------------- */}
      <footer className="app-footer">
        <p className="footer-line">
          <strong>{t.brandName}</strong> — Built for Google Developer Groups (GDG) Ideasprint 2026.
        </p>
        <p className="footer-sub">
          Theme: <code>#AI_For_Elders</code> | Accessible design with large touch targets, regional Odia &amp; Hindi speech support.
        </p>
      </footer>
    </div>
  );
}

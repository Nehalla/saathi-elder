import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded regardless of working directory
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const startedAt = new Date();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper paths for file persistence
const dataDir = path.join(__dirname, '../data');
const remindersFile = path.join(dataDir, 'reminders.json');
const contactsFile = path.join(dataDir, 'contacts.json');
const wellbeingFile = path.join(dataDir, 'wellbeing.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory / file helpers
function readJson(filePath, defaultValue = []) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
  return defaultValue;
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
    return false;
  }
}

// -------------------------------------------------------------
// Health Check (Retaining original endpoint)
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  const uptimeSeconds = Math.floor(process.uptime());
  res.json({
    status: 'ok',
    uptime: uptimeSeconds,
    uptimeHuman: `${uptimeSeconds}s`,
    startedAt: startedAt.toISOString(),
    environment: process.env.NODE_ENV || 'development',
    aiStatus: {
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      sarvamConfigured: Boolean(process.env.SARVAM_API_KEY)
    }
  });
});

// -------------------------------------------------------------
// Multilingual Elder Assistant Knowledge / Fallback Engine
// -------------------------------------------------------------
function generateElderAssistance(message, language = 'or') {
  const q = (message || '').toLowerCase();

  // Odia responses
  if (language === 'or') {
    if (q.includes('ନମସ୍କାର') || q.includes('hello') || q.includes('hi') || q.includes('କେମିତି')) {
      return "ନମସ୍କାର ଆଜ୍ଞା! ମୁଁ 'ସାଥୀ', ଆପଣଙ୍କ ଦୈନନ୍ଦିନ ସହାୟକ। ଆଜି ଆପଣ କିପରି ଅନୁଭବ କରୁଛନ୍ତି? ଆପଣଙ୍କ ଔଷଧ ସମୟ ହେଇଛି କି କାହାକୁ ଫୋନ କରିବାକୁ ଚାହାନ୍ତି?";
    }
    if (q.includes('ଔଷଧ') || q.includes('medicine') || q.includes('tablet')) {
      return "ଆପଣଙ୍କର ସକାଳ ରକ୍ତଚାପ ଔଷଧ ସକାଳ ୮:୩୦ ରେ ଜଳଖିଆ ପରେ ନେବାର ଅଛି। ଦୟାକରି ଉଷୁମ ପାଣି ସହ ଖାଆନ୍ତୁ। କୌଣସି ଅସୁବିଧା ଥିଲେ ଡାକ୍ତରଙ୍କ ପରାମର୍ଶ ନିଅନ୍ତୁ।";
    }
    if (q.includes('ଡାକ୍ତର') || q.includes('doctor') || q.includes('appointment')) {
      return "ଆସନ୍ତାକାଲି ଅପରାହ୍ନ ୫:୦୦ ଟାରେ ଡାକ୍ତର ଏସ. ମହାନ୍ତି (ହୃଦରୋଗ ବିଶେଷଜ୍ଞ)ଙ୍କ ସହ ଆପଣଙ୍କର ଅପଏଣ୍ଟମେଣ୍ଟ ଅଛି। ଦୟାକରି ପୁରୁଣା ପରୀକ୍ଷା ରିପୋର୍ଟ ସାଙ୍ଗରେ ନେବାକୁ ଭୁଲିବେନି।";
    }
    if (q.includes('ପାଣି') || q.includes('water')) {
      return "ବୟସ୍କ ବ୍ୟକ୍ତିଙ୍କ ପାଇଁ ଦିନକୁ ଅନ୍ତତଃ ୬ ରୁ ୮ ଗ୍ଲାସ ସ୍ୱଚ୍ଛ ପାଣି ପିଇବା ଅତ୍ୟନ୍ତ ଆବଶ୍ୟକ। ବର୍ତ୍ତମାନ ଏକ ଗ୍ଲାସ ପାଣି ପିଇ ବିଶ୍ରାମ ନିଅନ୍ତୁ।";
    }
    if (q.includes('ପୁଅ') || q.includes('ଝିଅ') || q.includes('କଲ') || q.includes('call') || q.includes('family')) {
      return "ଆପଣ ପୁଅ ରାଜେଶ (+91 98610 12345) କିମ୍ବା ଝିଅ ସୁନୀତାଙ୍କୁ କଲ୍ କରିବାକୁ ଚାହାନ୍ତି କି? ଜରୁରୀ ସହାୟତା ଟ୍ୟାବକୁ ଯାଇ ଗୋଟିଏ ବଟନ୍ ଦବାଇ ସିଧାସଳଖ କଲ୍ କରିପାରିବେ।";
    }
    return `ମୁଁ ଆପଣଙ୍କ କଥା ବୁଝିଲି: "${message}". ମୁଁ ଆପଣଙ୍କ ସହାୟତା ପାଇଁ ସର୍ବଦା ପ୍ରସ୍ତୁତ। ଆପଣଙ୍କୁ ଆଜି କୌଣସି ଔଷଧ, ଡାକ୍ତର ପରାମର୍ଶ କିମ୍ବା ପରିବାର ସହ କଥା ହେବାରେ ସାହାଯ୍ୟ ଦରକାର କି?`;
  }

  // Hindi responses
  if (language === 'hi') {
    if (q.includes('नमस्ते') || q.includes('hello') || q.includes('hi') || q.includes('हाल')) {
      return "नमस्ते जी! मैं 'साथी', आपका अपना दैनिक सहायक। आज आप कैसा महसूस कर रहे हैं? क्या आज आपकी दवाई का समय हो गया है या किसी से बात करनी है?";
    }
    if (q.includes('दवा') || q.includes('medicine') || q.includes('tablet')) {
      return "आपकी सुबह की बीपी की गोली नाश्ते के बाद सुबह 8:30 बजे लेने का समय है। कृपया इसे गुनगुने पानी के साथ लें।";
    }
    if (q.includes('डॉक्टर') || q.includes('doctor') || q.includes('appointment')) {
      return "कल शाम 5:00 बजे डॉ. एस. मोहंती जी के साथ आपका परामर्श तय है। अपनी पुरानी रिपोर्ट साथ ले जाना न भूलें।";
    }
    if (q.includes('पानी') || q.includes('water')) {
      return "बुजुर्गों के लिए दिन में पर्याप्त पानी पीना बहुत जरूरी है। अभी एक गिलास ताजा पानी पीकर थोड़ा आराम करें।";
    }
    if (q.includes('बेटा') || q.includes('बेटी') || q.includes('कॉल') || q.includes('call') || q.includes('परिवार')) {
      return "क्या आप बेटे राजेश (+91 98610 12345) को कॉल करना चाहते हैं? आप 'জরুরি ସହାୟତା / संपर्क' टैब में जाकर सीधे एक क्लिक में कॉल कर सकते हैं।";
    }
    return `मैंने आपकी बात सुनी: "${message}". मैं आपकी हर संभव मदद के लिए तैयार हूँ। क्या आपको दवा, डॉक्टर के समय या परिवार से संपर्क करने में सहायता चाहिए?`;
  }

  // English responses
  if (q.includes('hello') || q.includes('hi') || q.includes('how are you')) {
    return "Hello! I am 'Saathi', your caring daily companion. How are you feeling today? Would you like me to check your medication, appointments, or contact someone?";
  }
  if (q.includes('medicine') || q.includes('pill') || q.includes('tablet')) {
    return "Your morning BP medication is scheduled for 8:30 AM after breakfast. Remember to drink a full glass of warm water.";
  }
  if (q.includes('doctor') || q.includes('appointment')) {
    return "You have a checkup scheduled with Dr. S. Mohanty (Cardiologist) tomorrow at 5:00 PM. Please remember to bring your past test records.";
  }
  if (q.includes('water') || q.includes('hydrate')) {
    return "Staying hydrated is vital for good health. Please enjoy a glass of fresh water right now and rest comfortably.";
  }
  return `I heard you say: "${message}". I am here beside you to assist with your daily reminders, appointments, or connecting with your family. How may I support you?`;
}

// -------------------------------------------------------------
// Helper: Parse Odia Numerals to standard numbers
// -------------------------------------------------------------
function parseOdiaNumerals(str) {
  if (!str) return '';
  const odiaDigits = ['୦', '୧', '୨', '୩', '୪', '୫', '୬', '୭', '୮', '୯'];
  let res = str;
  odiaDigits.forEach((d, idx) => {
    res = res.replaceAll(d, idx.toString());
  });
  return res;
}

// -------------------------------------------------------------
// Single Source of Truth: Create Reminder Record (Shared)
// -------------------------------------------------------------
function createReminderRecord(data) {
  const { type, title, time, meal, date, location, notes } = data;

  if (!title || !title.trim()) {
    throw new Error('Title is required');
  }

  const reminders = readJson(remindersFile, []);
  const cleanTitle = title.trim();
  const cleanTime = time ? time.trim() : '08:30 AM';

  // Check duplicate (same title and time)
  const existing = reminders.find(
    r => r.title.toLowerCase() === cleanTitle.toLowerCase() && r.time === cleanTime
  );

  if (existing) {
    return { reminder: existing, isDuplicate: true };
  }

  const newReminder = {
    id: `rem-${Date.now()}`,
    type: type || 'medication',
    title: cleanTitle,
    time: cleanTime,
    meal: meal || '',
    date: date || '',
    location: location || '',
    notes: notes || '',
    completed: false,
    createdAt: new Date().toISOString()
  };

  reminders.unshift(newReminder);
  writeJson(remindersFile, reminders);
  return { reminder: newReminder, isDuplicate: false };
}

// -------------------------------------------------------------
// Intent Detection for Reminders (English, Hindi, Odia)
// -------------------------------------------------------------
function detectReminderIntent(message) {
  const rawText = (message || '').trim();
  const text = parseOdiaNumerals(rawText);
  const lower = text.toLowerCase();

  // Negative check: If it's a question about existing reminders, do NOT create
  const isQuestion = /^(when|what|did|do|how|is|are)\b/i.test(text) ||
                     lower.includes('when is') ||
                     lower.includes('କେତେବେଳେ') ||
                     lower.includes('କେବେ') ||
                     lower.includes('କଣ') ||
                     lower.includes('କ’ଣ') ||
                     lower.includes('कब है') ||
                     lower.includes('समय क्या') ||
                     lower.includes('schedule?') ||
                     text.endsWith('?');

  const hasExplicitCommand = /\b(add|remind me to take|remind me to|set a reminder|set reminder|schedule)\b/i.test(text) ||
                            /(ଯୋଡ଼ନ୍ତୁ|ଯୋଡନ୍ତୁ|ଲେଖନ୍ତୁ)/.test(text) ||
                            /(जोड़ें|जोड़ें|लगाएं|शेड्यूल)/.test(text);

  if (isQuestion && !hasExplicitCommand) {
    return null;
  }

  if (!hasExplicitCommand && !/\b(remember|medicine at|tablet at)\b/i.test(text)) {
    return null;
  }

  // Detect Type
  const isDoctor = /\b(doctor|dr|appointment|checkup|clinic|hospital)\b/i.test(text) ||
                   /(ଡାକ୍ତର|ଅପଏଣ୍ଟମେଣ୍ଟ|କ୍ଲିନିକ୍)/.test(text) ||
                   /(डॉक्टर|चेकअप|क्लिनिक)/.test(text);
  const type = isDoctor ? 'appointment' : 'medication';

  // Extract Time
  let time = '08:30 AM';
  const timeMatch = text.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))/);
  if (timeMatch) {
    time = timeMatch[1].toUpperCase();
  } else {
    const regionalTimeMatch = text.match(/(\d{1,2}(?::\d{2})?)\s*(बजे|ଟାରେ|am|pm)/i);
    if (regionalTimeMatch) {
      let hr = parseInt(regionalTimeMatch[1], 10);
      let isPm = lower.includes('शाम') || lower.includes('रात') || lower.includes('ସନ୍ଧ୍ୟା') || lower.includes('ରାତି') || lower.includes('pm');
      if (isPm && hr < 12) hr += 12;
      const formattedHr = hr < 10 ? `0${hr}` : `${hr}`;
      time = `${formattedHr}:00 ${isPm ? 'PM' : 'AM'}`;
    }
  }

  // Extract Meal instructions
  let meal = '';
  if (/after (?:breakfast|food|meal|lunch|dinner)/i.test(text) || /ଜଳଖିଆ ପରେ|ଖାଇବା ପରେ/.test(text) || /नाश्ते के बाद|खाने के बाद/.test(text)) {
    meal = 'After meal / ଖାଇବା ପରେ / खाने के बाद';
  } else if (/before (?:breakfast|food|meal|lunch|dinner)|empty stomach/i.test(text) || /ଖାଲି ପେଟରେ|ଜଳଖିଆ ପୂର୍ବରୁ/.test(text) || /खाली पेट|खाने से पहले/.test(text)) {
    meal = 'Before meal / ଖାଲି ପେଟରେ / खाली पेट';
  }

  // Extract Title
  let cleanTitle = text
    .replace(/\b(please|can you|could you|kindly|add|remind me to take|remind me for|remind me to|set a reminder for|set reminder for|my medicine|my appointment|medicine|tablet|pill|at \d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?|after breakfast|before breakfast|after food|empty stomach)\b/gi, '')
    .replace(/(ଦୟାକରି|ମୋର|ଔଷଧ|ଯୋଡ଼ନ୍ତୁ|ଯୋଡନ୍ତୁ|ସକାଳ|ସନ୍ଧ୍ୟା|\d{1,2}\s*ଟାରେ|ଖାଇବା ପରେ|ଖାଲି ପେଟରେ)/g, '')
    .replace(/(कृपया|मेरी|दवाई|दवा|जोड़ें|जोड़ें|सुबह|शाम|\d{1,2}\s*बजे|नाश्ते के बाद|खाने के बाद|खाली पेट)/g, '')
    .replace(/[.,!?]/g, '')
    .trim();

  if (!cleanTitle || cleanTitle.length < 2) {
    const commonMeds = text.match(/(paracetamol|metformin|amlodipine|pantocid|aspirin|calcium|vitamin|insulin|blood pressure|bp|sugar|ଡାକ୍ତର|ପାରାସିଟାମୋଲ|पैरासिटामोल)/i);
    if (commonMeds) {
      cleanTitle = commonMeds[1];
    } else {
      return { needsTitle: true, time, type, meal };
    }
  }

  return {
    type,
    title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
    time,
    meal,
    notes: 'Added via Saathi chat'
  };
}

// -------------------------------------------------------------
// Gemini API with Exponential Backoff & Candidate Model Fallback
// -------------------------------------------------------------
async function callGeminiWithRetry(formattedContents, systemInstruction, apiKey) {
  const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3-flash-preview', 'gemini-flash-latest'];
  let lastError = null;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: formattedContents,
              systemInstruction: {
                parts: [{ text: systemInstruction }]
              },
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 350
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textOutput) {
            return { text: textOutput, model };
          }
        }

        const errorBody = await response.text();
        console.warn(`Gemini ${model} attempt ${attempt} returned status ${response.status}:`, errorBody);
        lastError = new Error(`Gemini ${model} (${response.status})`);

        // If 503 (high demand/overloaded) or 429 (rate limit), retry with backoff
        if ((response.status === 503 || response.status === 429) && attempt < 2) {
          await new Promise(r => setTimeout(r, 600 * attempt));
          continue;
        }

        // Otherwise move to next candidate model
        break;
      } catch (err) {
        console.warn(`Fetch error for Gemini ${model} attempt ${attempt}:`, err.message);
        lastError = err;
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 600 * attempt));
        }
      }
    }
  }

  throw lastError || new Error('All Gemini candidate models exhausted');
}

// -------------------------------------------------------------
// Priority 1: AI Companion Chat Endpoint
// -------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  const { message, language = 'or', conversationHistory = [] } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // 1. Check Reminder Creation Intent
  const reminderIntent = detectReminderIntent(message);

  if (reminderIntent) {
    if (reminderIntent.needsTitle) {
      const askTitleResponses = {
        or: 'ଆପଣ କେଉଁ ଔଷଧ ନାମରେ ରିମାଇଣ୍ଡର ରଖିବାକୁ ଚାହାନ୍ତି? ଦୟାକରି ଔଷଧର ନାମ କୁହନ୍ତୁ।',
        hi: 'आप किस दवाई के लिए रिमाइंडर लगाना चाहते हैं? कृपया दवाई का नाम बताएं।',
        en: 'Which medicine would you like me to set a reminder for? Please tell me the name.'
      };
      return res.json({
        response: askTitleResponses[language] || askTitleResponses.or,
        reminderCreated: false,
        needsTitle: true,
        isLiveAI: Boolean(apiKey),
        provider: 'saathi-assistant',
        language
      });
    }

    try {
      const { reminder: savedReminder, isDuplicate } = createReminderRecord(reminderIntent);
      const confirmations = {
        or: `ଆପଣଙ୍କର ଔଷଧ '${savedReminder.title}' ସମୟ ${savedReminder.time} ପାଇଁ ${isDuplicate ? 'ପୂର୍ବରୁ ସାଇତା ହୋଇଛି' : 'ସଫଳତାର ସହ ଯୋଡ଼ାଗଲା'}। ଆପଣ ଏହାକୁ 'ଔଷଧ ଓ ଡାକ୍ତର' ଟ୍ୟାବରେ ଦେଖିପାରିବେ।`,
        hi: `आपकी दवाई '${savedReminder.title}' समय ${savedReminder.time} के लिए ${isDuplicate ? 'पहले से सुरक्षित है' : 'सफलतापूर्वक जोड़ दी गई है'}। आप इसे 'दवाई और डॉक्टर' टैब में देख सकते हैं।`,
        en: `Your reminder for '${savedReminder.title}' at ${savedReminder.time} has been ${isDuplicate ? 'found in your schedule' : 'successfully added'}. You can view it in the Reminders & Doctors tab.`
      };

      return res.json({
        response: confirmations[language] || confirmations.or,
        reminderCreated: true,
        reminder: savedReminder,
        isDuplicate,
        isLiveAI: Boolean(apiKey),
        provider: 'saathi-assistant',
        language
      });
    } catch (err) {
      console.error('Failed to create reminder via chat:', err.message);
      return res.status(400).json({ error: err.message });
    }
  }

  // 2. Regular Conversational AI
  const langNames = {
    or: 'Odia (ଓଡ଼ିଆ)',
    hi: 'Hindi (हिन्दी)',
    en: 'English'
  };
  const selectedLangName = langNames[language] || 'Odia (ଓଡ଼ିଆ)';

  if (apiKey) {
    try {
      const systemInstruction = `You are "Saathi" (ସାଥୀ / साथी), a gentle, respectful, compassionate AI companion designed specifically for older adults in India.
Language preference: The user selected ${selectedLangName}. Always reply fluently and naturally in ${selectedLangName}.
Key principles:
1. Address the elder with deep cultural respect (e.g. ଆପଣ / आप / Sir or Ma'am).
2. Keep answers concise, clear, and easy to read (short paragraphs, gentle tone).
3. Medical Safety: You are an everyday companion, NOT a medical doctor. Never diagnose, prescribe, or change medications. Advise them warmly to verify with their doctor or trusted family member.
4. Help with daily motivation, reminders, light humor, emotional comfort, and simple guidance.`;

      const formattedContents = [];
      if (Array.isArray(conversationHistory)) {
        conversationHistory.slice(-4).forEach(item => {
          if (item.text) {
            formattedContents.push({
              role: item.sender === 'user' ? 'user' : 'model',
              parts: [{ text: item.text }]
            });
          }
        });
      }
      formattedContents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const result = await callGeminiWithRetry(formattedContents, systemInstruction, apiKey);

      return res.json({
        response: result.text,
        provider: result.model,
        isLiveAI: true,
        language
      });
    } catch (err) {
      console.warn('Live Gemini call failed after retries and model fallbacks:', err.message);
      const fallbackText = generateElderAssistance(message, language);
      return res.json({
        response: fallbackText,
        provider: 'saathi-assistant-preview',
        isLiveAI: false,
        keyNotice: `Gemini service is temporarily experiencing high demand (${err.message}). Showing local elder assistant response.`,
        language
      });
    }
  }

  // When GEMINI_API_KEY is not configured
  const elderResponse = generateElderAssistance(message, language);
  return res.json({
    response: elderResponse,
    provider: 'saathi-assistant-preview',
    isLiveAI: false,
    keyNotice: 'Gemini API key not configured in server/.env. Running in interactive Elder Assistant preview mode.',
    language
  });
});

// -------------------------------------------------------------
// Priority 2: Sarvam AI Speech Integration
// -------------------------------------------------------------
app.post('/api/tts', async (req, res) => {
  const { text, language = 'or' } = req.body;
  const sarvamKey = process.env.SARVAM_API_KEY;

  if (!sarvamKey) {
    return res.json({
      supported: false,
      useBrowserSpeech: true,
      reason: 'SARVAM_API_KEY not configured in server/.env. Using browser Web Speech API.'
    });
  }

  try {
    const langCodeMap = {
      or: 'od-IN',
      hi: 'hi-IN',
      en: 'en-IN'
    };
    const targetCode = langCodeMap[language] || 'od-IN';

    const sarvamRes = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': sarvamKey
      },
      body: JSON.stringify({
        inputs: [text.slice(0, 300)],
        target_language_code: targetCode,
        speaker: 'ritu',
        model: 'bulbul:v3'
      })
    });

    if (!sarvamRes.ok) {
      const errText = await sarvamRes.text();
      console.error('Sarvam TTS error:', sarvamRes.status, errText);
      return res.json({
        supported: false,
        useBrowserSpeech: true,
        reason: `Sarvam API error (${sarvamRes.status})`
      });
    }

    const data = await sarvamRes.json();
    return res.json({
      supported: true,
      audioBase64: data.audios?.[0],
      provider: 'sarvam-bulbul-v3'
    });
  } catch (err) {
    console.error('Sarvam request exception:', err.message);
    return res.json({
      supported: false,
      useBrowserSpeech: true,
      reason: err.message
    });
  }
});

// -------------------------------------------------------------
// Priority 3: Reminders and Appointments
// -------------------------------------------------------------
app.get('/api/reminders', (req, res) => {
  const reminders = readJson(remindersFile, []);
  res.json({ reminders });
});

app.post('/api/reminders', (req, res) => {
  try {
    const { reminder, isDuplicate } = createReminderRecord(req.body);
    res.status(201).json({ reminder, isDuplicate });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/reminders/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const reminders = readJson(remindersFile, []);

  const index = reminders.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  reminders[index] = { ...reminders[index], ...updates };
  writeJson(remindersFile, reminders);
  res.json({ reminder: reminders[index] });
});

app.delete('/api/reminders/:id', (req, res) => {
  const { id } = req.params;
  let reminders = readJson(remindersFile, []);
  reminders = reminders.filter(r => r.id !== id);
  writeJson(remindersFile, reminders);
  res.json({ success: true, id });
});

// -------------------------------------------------------------
// Priority 4: Trusted Contacts and SOS
// -------------------------------------------------------------
app.get('/api/contacts', (req, res) => {
  const contacts = readJson(contactsFile, []);
  res.json({ contacts });
});

app.post('/api/contacts', (req, res) => {
  const { name, phone, relationship, isPrimary } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone number are required' });
  }

  const contacts = readJson(contactsFile, []);
  const newContact = {
    id: `c-${Date.now()}`,
    name: name.trim(),
    phone: phone.trim(),
    relationship: relationship || 'Family',
    isPrimary: Boolean(isPrimary),
    notifyOnSOS: true
  };

  contacts.push(newContact);
  writeJson(contactsFile, contacts);
  res.status(201).json({ contact: newContact });
});

app.delete('/api/contacts/:id', (req, res) => {
  const { id } = req.params;
  let contacts = readJson(contactsFile, []);
  contacts = contacts.filter(c => c.id !== id);
  writeJson(contactsFile, contacts);
  res.json({ success: true, id });
});

// -------------------------------------------------------------
// Priority 5: Wellbeing Daily Check-in
// -------------------------------------------------------------
app.get('/api/wellbeing', (req, res) => {
  const defaultWellbeing = {
    todayMood: 'good',
    waterGlasses: 4,
    lastCheckIn: new Date().toLocaleTimeString(),
    stepCountDemo: 6240,
    dailyQuote: {
      or: 'ପ୍ରତିଦିନ ସକାଳେ ଅଳ୍ପ ଚାଲିବା ଏବଂ ପ୍ରଚୁର ପାଣି ପିଇବା ସ୍ୱାସ୍ଥ୍ୟ ପାଇଁ ଅତ୍ୟନ୍ତ ଉପକାରୀ।',
      hi: 'रोज सुबह थोड़ा टहलना और भरपूर पानी पीना सेहत के लिए वरदान है।',
      en: 'A gentle morning stroll and staying hydrated brings vitality and peaceful sleep.'
    }
  };
  const wellbeing = readJson(wellbeingFile, defaultWellbeing);
  res.json(wellbeing);
});

app.post('/api/wellbeing', (req, res) => {
  const current = readJson(wellbeingFile, {});
  const updated = {
    ...current,
    ...req.body,
    lastCheckIn: new Date().toLocaleTimeString()
  };
  writeJson(wellbeingFile, updated);
  res.json(updated);
});

// -------------------------------------------------------------
// Production Single-Host Serving
// -------------------------------------------------------------
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`Serving static production build from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Saathi AI Server listening on port ${PORT}`);
});

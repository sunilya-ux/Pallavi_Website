import React, { useState } from 'react';
import { MessageCircle, X, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Where can I check the portal link?',
    answer: 'Your portal link is https://mufzfumvtfcyymgqecph.app.clientclub.net/. Log in using the email and password you were given.',
  },
  {
    question: 'How can I access the portal or log in?',
    answer: 'Click this link: https://mufzfumvtfcyymgqecph.app.clientclub.net/. Enter your login details and you will see the courses you are enrolled in.',
  },
  {
    question: 'How can I access the portal easily every time?',
    answer: 'Once you log in successfully, save or bookmark the link in your browser so you can open it anytime without searching for it again.',
  },
  {
    question: 'How do I submit answers for assignments?',
    answer: 'If it is a simple answer (like Done / Not Done), just reply in the comments. If it needs more detail or a process, upload a document instead — you can type it in a Google Doc, or even write it by hand in a notebook and upload a photo.',
  },
  {
    question: 'How can I upload documents in the classroom?',
    answer: 'Open the assignment, click the Upload / Attach file option, then select your document and submit.',
  },
  {
    question: 'Should I write in comments or upload a document?',
    answer: 'For short answers, use the comment section. For detailed answers or exercises, upload a document.',
  },
  {
    question: 'How do I do journaling?',
    answer: 'You can journal in your personal notebook, or type it in a document and upload it if required for submission. Each assignment includes a prompt to guide what to focus on, usually your thoughts, learnings, and reflections.',
  },
  {
    question: 'Where can I check my assignments?',
    answer: 'All your assignments are available inside the Assignments section of the student portal.',
  },
  {
    question: 'I am using an iPad and cannot open my assignments. What do I do?',
    answer: 'Try opening it from a laptop instead. You can also use the class code — just make sure you are logged in with the same email that was shared with the team.',
  },
  {
    question: 'Why does the morning ritual video take longer than 5 to 10 minutes?',
    answer: 'It is normal for it to take a bit longer the first few times. From the next day onward, it usually takes hardly 10 minutes. If you still have questions, you can get clarity from Pallavi in the weekly sessions.',
  },
  {
    question: 'What are the steps of the morning ritual?',
    answer: '1) Set your intention for the day. 2) Do box breathing for 1 minute (3 cycles). 3) Set one weekly goal (personal, professional, financial, or health). 4) Write 3 tasks for today that move you toward that goal. 5) Write 3 affirmations and read each one 5 to 7 times out loud. 6) Read your "Version 2" — your future self 3 months from now, written in present tense.',
  },
  {
    question: 'Which days is the team off and when should I not expect a response?',
    answer: 'We are off on Sundays and Mondays, so please expect no response or delays on these days.',
  },
  {
    question: 'How do I get urgent help with a client acquisition query?',
    answer: 'Label your message "Urgent Client" in your batch WhatsApp group to get the fastest response.',
  },
  {
    question: 'Is there phone or individual WhatsApp support?',
    answer: 'We do not offer phone calls or individual WhatsApp support. Please send any query in your batch WhatsApp group.',
  },
  {
    question: 'When are the weekly calls and how do I join?',
    answer: 'Weekly calls are every Wednesday and Saturday at 6:30 PM for doubts, feedback, and progress checks. The Zoom link is in your WhatsApp group description section.',
  },
  {
    question: 'Are there monthly bootcamps?',
    answer: 'Yes! Bootcamps are held every 4th Saturday and Sunday of the month for certification and monetization batches, to implement the program tools live. On bootcamp weekends, the regular Saturday evening call is not conducted.',
  },
  {
    question: 'Where can I find the session recordings?',
    answer: 'The recordings link is in your WhatsApp group description section. Weekly session recordings are usually uploaded within 24 to 48 hours on working days, excluding weekly off days.',
  },
  {
    question: 'What are your working hours?',
    answer: 'We are operational from 11 AM to 6 PM.',
  },
  {
    question: 'When is EMI due and what happens if I am late?',
    answer: 'EMI is due by the 5th of every month. After that, a penalty of 500 rupees per day applies.',
  },
];

const STOP_WORDS = new Set(['the', 'a', 'an', 'is', 'are', 'do', 'does', 'i', 'my', 'to', 'in', 'of', 'for', 'and', 'how', 'what', 'where', 'when', 'why', 'can', 'you', 'me', 'it', 'this', 'that', 'am', 'if', 'be']);

const SYNONYM_GROUPS: string[][] = [
  ['login', 'log', 'signin', 'sign'],
  ['upload', 'attach', 'submit', 'submitting'],
  ['assignment', 'assignments', 'homework', 'task', 'tasks'],
  ['portal', 'site', 'website', 'link'],
  ['classroom', 'class'],
  ['whatsapp', 'whats', 'app'],
  ['recording', 'recordings', 'record'],
  ['ipad', 'tablet'],
  ['document', 'documents', 'doc', 'docs'],
  ['journal', 'journaling', 'journals'],
  ['call', 'calls', 'session', 'sessions', 'zoom', 'meeting'],
  ['bootcamp', 'bootcamps'],
  ['emi', 'payment', 'fee', 'fees'],
  ['comment', 'comments'],
  ['ritual', 'rituals', 'routine'],
];

const SYNONYM_MAP: Record<string, string> = {};
for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    SYNONYM_MAP[word] = group[0];
  }
}

function stem(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.length > 4 && word.endsWith('es')) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function normalizeToWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    .map((w) => SYNONYM_MAP[w] || SYNONYM_MAP[stem(w)] || stem(w));
}

function findBestMatch(input: string): FAQItem | null {
  const inputWords = normalizeToWords(input);
  if (inputWords.length === 0) return null;

  let bestItem: FAQItem | null = null;
  let bestScore = 0;

  for (const item of FAQ_ITEMS) {
    const questionWords = normalizeToWords(item.question);
    const overlap = inputWords.filter((w) => questionWords.includes(w)).length;
    if (overlap > bestScore) {
      bestScore = overlap;
      bestItem = item;
    }
  }

  const matchRatio = bestScore / inputWords.length;
  const isMatch = bestScore >= 2 || (bestScore >= 1 && matchRatio >= 0.5);
  return isMatch ? bestItem : null;
}

export default function FAQChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [searchResult, setSearchResult] = useState<{ answer: string } | { notFound: true } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleQuestion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
    setSearchResult(null);
  };

  const handleSearch = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || submitting) return;

    const match = findBestMatch(trimmed);

    if (match) {
      setSearchResult({ answer: match.answer });
      setInputValue('');
      return;
    }

    setSubmitting(true);
    setSearchResult({ notFound: true });

    try {
      const clientId = localStorage.getItem('clientId');
      const clientEmail = localStorage.getItem('clientEmail');

      await supabase.from('faq_unanswered_questions').insert({
        question_text: trimmed,
        client_id: clientId || null,
        client_email: clientEmail || null,
      });
    } catch (err) {
      console.error('[FAQChatWidget] Failed to log unanswered question:', err);
    } finally {
      setSubmitting(false);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '72px',
            right: '0',
            width: '340px',
            maxHeight: '520px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              backgroundColor: '#0f9d70',
              color: '#ffffff',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '16px' }}>Need Help?</span>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffffff' }}
              aria-label="Close help"
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSearch}
              disabled={submitting}
              style={{
                width: '40px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#0f9d70',
                color: '#ffffff',
                cursor: submitting ? 'default' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Search"
            >
              <Send size={16} />
            </button>
          </div>

          {searchResult && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f0fdf4',
                borderBottom: '1px solid #f0f0f0',
                fontSize: '13px',
                color: '#065f46',
                lineHeight: 1.5,
              }}
            >
              {'answer' in searchResult
                ? searchResult.answer
                : "We don't have an answer for that yet. Your question has been saved and Pallavi will follow up on it."}
            </div>
          )}

          <div style={{ overflowY: 'auto', padding: '8px' }}>
            {FAQ_ITEMS.map((item, index) => (
              <div key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <button
                  onClick={() => toggleQuestion(index)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: '12px 8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#111827',
                  }}
                >
                  <span>{item.question}</span>
                  {expandedIndex === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedIndex === index && (
                  <p style={{ padding: '0 8px 12px 8px', fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>
                    {item.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#0f9d70',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Open help chat"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}

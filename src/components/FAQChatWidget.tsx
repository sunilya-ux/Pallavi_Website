import React, { useState } from 'react';
import { MessageCircle, X, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How do I submit an assignment?',
    answer: 'Go to the Certification section in the sidebar and click Assignments. Select the assignment, upload your file, and click Submit. Once submitted, you cannot edit it, so please double-check before submitting.',
  },
  {
    question: 'Where do I find my certification tools?',
    answer: 'Click Certification in the left sidebar to see tools like the Passion Roadmap Creator, Vision Board Generator, SMART Goal Generator, and more.',
  },
  {
    question: 'What is in the Monetization section?',
    answer: 'Monetization includes tools to help you turn your coaching practice into income, like the Big Money Content Generator and Monetizable Passion Analysis.',
  },
  {
    question: 'What is Beyond Coaching?',
    answer: 'Beyond Coaching has advanced tools like the YouTube Video Script Generator, Webinar Builder, and Hook Builder to help grow your content and audience.',
  },
  {
    question: 'I am stuck or something is not working. What do I do?',
    answer: 'Please reach out to Pallavi directly with a description of what you were trying to do and what happened. She will be happy to help.',
  },
];

export default function FAQChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
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
            maxHeight: '480px',
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

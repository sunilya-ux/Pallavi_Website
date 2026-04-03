import { useState, useRef, useEffect } from 'react';
import { Loader2, Copy, Download, Youtube, RefreshCw } from 'lucide-react';

export default function YouTubeChannelDescriptionGenerator() {
  const [formData, setFormData] = useState({
    name: '',
    audience: '',
    challenges: '',
    result: '',
    experience: '',
    topics: '',
    website: '',
    email: '',
    social: '',
    message: '',
  });
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.name || !formData.audience || !formData.challenges || !formData.result) {
      setError('Please fill in all required fields (Name, Audience, Challenges, and Transformation)');
      return;
    }

    setError('');
    setLoading(true);
    setGeneratedDescription('');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-channel-description`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate description');
      }

      const data = await response.json();
      setGeneratedDescription(data.description);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate description');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNew = () => {
    setGeneratedDescription('');
    setError('');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedDescription);
      alert('Description copied to clipboard!');
    } catch (err) {
      console.error('Copy failed:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          content: generatedDescription,
          title: 'YouTube Channel Description',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'youtube-channel-description.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" ref={resultRef}>
        <div className="bg-gradient-to-r from-red-600 to-rose-600 p-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Youtube className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">YouTube Channel Description Generator</h1>
            </div>
          </div>
          <p className="text-red-50 text-lg">
            Create a clear, engaging, and personalized YouTube channel description based on your niche and audience.
          </p>
        </div>

        <div className="p-8">
          {!generatedDescription ? (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  {error}
                </div>
              )}

              <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                1. What is your name? <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                placeholder="Your name or channel name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                2. Who do you help? (your audience) <span className="text-red-600">*</span>
              </label>
              <textarea
                name="audience"
                value={formData.audience}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors resize-none"
                placeholder="e.g., Aspiring entrepreneurs, busy parents, fitness beginners..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                3. What challenges does your audience face? <span className="text-red-600">*</span>
              </label>
              <textarea
                name="challenges"
                value={formData.challenges}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors resize-none"
                placeholder="Describe the main problems or struggles they experience"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                4. What transformation or result do you help them achieve? <span className="text-red-600">*</span>
              </label>
              <textarea
                name="result"
                value={formData.result}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors resize-none"
                placeholder="What outcomes or changes do you help them create?"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                5. What is your experience or credibility?
              </label>
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors resize-none"
                placeholder="Your background, achievements, certifications, or expertise"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                6. What topics will you create content on?
              </label>
              <textarea
                name="topics"
                value={formData.topics}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors resize-none"
                placeholder="Main themes, content pillars, or subject areas you'll cover"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                7. Do you have a website or offer link? (optional)
              </label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                8. What is your contact email?
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                9. Any social media links?
              </label>
              <textarea
                name="social"
                value={formData.social}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors resize-none"
                placeholder="Instagram, Twitter, LinkedIn, TikTok links..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                10. Add a personal message you want to include
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors resize-none"
                placeholder="A personal note, invitation, or call to action"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/30 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating your channel description...
                </>
              ) : (
                <>
                  <Youtube className="w-5 h-5" />
                  Generate Channel Description
                </>
              )}
            </button>
          </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={handleGenerateNew}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Generate New
                </button>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-red-50 border-2 border-slate-200 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">Your Channel Description</h3>
                <div className="whitespace-pre-wrap text-slate-800 leading-relaxed text-base">
                  {generatedDescription}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

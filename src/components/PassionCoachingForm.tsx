import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, Loader, Copy, Check, RotateCcw } from 'lucide-react';

interface PassionCoachingFormProps {
  clientId: string;
}

export default function PassionCoachingForm({ clientId }: PassionCoachingFormProps) {
  const [formData, setFormData] = useState({
    audienceDescription: '',
    idealClient: '',
    mainOffer: '',
    promisedResult: '',
    proofStory: '',
    postsPerWeek: '',
    contentPreference: '',
  });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [existingResponse, setExistingResponse] = useState<any>(null);
  const [aiContent, setAiContent] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadExistingResponse();
  }, [clientId]);

  const loadExistingResponse = async () => {
    try {
      const { data, error } = await supabase
        .from('passion_coaching_responses')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setExistingResponse(data);
        setFormData({
          audienceDescription: data.audience_description || '',
          idealClient: data.ideal_client || '',
          mainOffer: data.main_offer || '',
          promisedResult: data.promised_result || '',
          proofStory: data.proof_story || '',
          postsPerWeek: data.posts_per_week || '',
          contentPreference: data.content_preference || '',
        });
      }
    } catch (err) {
      console.error('Error loading existing response:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGenerating(true);
    setError('');
    setSuccess(false);
    setAiContent('');

    try {
      const payload = {
        client_id: clientId,
        audience_description: formData.audienceDescription,
        ideal_client: formData.idealClient,
        main_offer: formData.mainOffer,
        promised_result: formData.promisedResult,
        proof_story: formData.proofStory,
        posts_per_week: formData.postsPerWeek,
        content_preference: formData.contentPreference,
        updated_at: new Date().toISOString(),
      };

      if (existingResponse) {
        const { error } = await supabase
          .from('passion_coaching_responses')
          .update(payload)
          .eq('id', existingResponse.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('passion_coaching_responses')
          .insert([payload]);

        if (error) throw error;
      }

      setSuccess(true);
      setLoading(false);

      await generateContent();
    } catch (err: any) {
      setError(err.message || 'Failed to submit form. Please try again.');
      setLoading(false);
      setGenerating(false);
    }
  };

  const generateContent = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-passion-coaching-content`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audienceDescription: formData.audienceDescription,
            idealClientDescription: formData.idealClient,
            mainOffer: formData.mainOffer,
            promisedResult: formData.promisedResult,
            proofOrStory: formData.proofStory,
            postsPerWeek: formData.postsPerWeek,
            preferredContentType: formData.contentPreference,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const data = await response.json();
      setAiContent(data.content);
    } catch (err: any) {
      setError(err.message || 'Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(aiContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRegenerate = () => {
    setAiContent('');
    setGenerating(true);
    generateContent();
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Passion Coaching SMM Questionnaire
        </h2>
        <p className="text-slate-600 mb-8">
          Please answer the following questions to help us create your personalized social media strategy.
        </p>

        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-800">
              Your responses have been saved successfully!
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {generating && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <Loader className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Generating your personalized content strategy...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <AutoGrowTextarea
            label="1. Which best describes your audience?"
            placeholder="For example: Working women, Homemakers, Both"
            value={formData.audienceDescription}
            onChange={(value) => handleChange('audienceDescription', value)}
          />

          <AutoGrowTextarea
            label="2. Tell me about your ideal client."
            placeholder="Short answer – 2 to 3 lines is enough. Example: 'She's in a corporate job, earning well but feels empty, confused, and scared to quit.'"
            value={formData.idealClient}
            onChange={(value) => handleChange('idealClient', value)}
          />

          <AutoGrowTextarea
            label="3. What is your main offer right now?"
            placeholder="For example: 1:1 Passion Discovery Session, 90-min clarity call, 3-hour Zoom workshop, etc."
            value={formData.mainOffer}
            onChange={(value) => handleChange('mainOffer', value)}
          />

          <AutoGrowTextarea
            label="4. What result do you promise from this offer?"
            placeholder="Example: 'Clarity on what I'm meant to do', 'Clear next steps without quitting my job', 'Confidence to start my own thing'"
            value={formData.promisedResult}
            onChange={(value) => handleChange('promisedResult', value)}
          />

          <AutoGrowTextarea
            label="5. Do you have any proof or story you can use right now?"
            placeholder="This can be: your own story OR your mentor's story OR a client story. Just 2–3 lines is enough."
            value={formData.proofStory}
            onChange={(value) => handleChange('proofStory', value)}
          />

          <AutoGrowTextarea
            label="6. How many posts per week do you want to do on Instagram?"
            placeholder="Just pick one number: 3 / 4 / 5 / 7"
            value={formData.postsPerWeek}
            onChange={(value) => handleChange('postsPerWeek', value)}
          />

          <AutoGrowTextarea
            label="7. What type of content do you prefer more right now?"
            placeholder="Example: 2 Reels + 2 Carousels + 1 Static post"
            value={formData.contentPreference}
            onChange={(value) => handleChange('contentPreference', value)}
          />

          <button
            type="submit"
            disabled={loading || generating}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </form>
      </div>

      {aiContent && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Your Personalized Content Strategy
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm font-medium">Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={handleRegenerate}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm font-medium">Regenerate</span>
              </button>
            </div>
          </div>
          <div className="prose prose-slate max-w-none">
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
              {aiContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AutoGrowTextareaProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

function AutoGrowTextarea({ label, placeholder, value, onChange }: AutoGrowTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm sm:text-base font-semibold text-slate-900">
        {label}
      </label>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none overflow-hidden text-slate-900 placeholder:text-slate-400"
        rows={2}
      />
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { Image, Loader, Download, RefreshCw, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FormData {
  financial: string;
  fun: string;
  relationships: string;
  contribution: string;
  career: string;
  health: string;
  personal: string;
}

export default function VisionBoardGenerator() {
  const [formData, setFormData] = useState<FormData>({
    financial: '',
    fun: '',
    relationships: '',
    contribution: '',
    career: '',
    health: '',
    personal: ''
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progressStep, setProgressStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setUploadedFileName(file.name);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    setUploadedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasAtLeastOneField = Object.values(formData).some(val => val.trim());
    if (!hasAtLeastOneField) {
      setError('Please fill in at least one field');
      return;
    }

    setGenerating(true);
    setError('');
    setGeneratedImageUrl('');
    setElapsedTime(0);
    setProgressStep(0);

    // Timer for elapsed time
    const timerInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    // Progress message rotation every 5 seconds
    const progressInterval = setInterval(() => {
      setProgressStep(prev => (prev + 1) % 4);
    }, 5000);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-vision-board`;

      let authToken: string;
      if (localStorage.getItem('clientId')) {
        authToken = import.meta.env.VITE_SUPABASE_ANON_KEY;
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          uploadedImage
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate vision board');
      }

      const result = await response.json();
      setGeneratedImageUrl(result.imageUrl);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating your vision board');
    } finally {
      clearInterval(timerInterval);
      clearInterval(progressInterval);
      setGenerating(false);
    }
  };

  const handleGenerateNew = () => {
    setGeneratedImageUrl('');
    setError('');
    setElapsedTime(0);
    setProgressStep(0);
    setFormData({
      financial: '',
      fun: '',
      relationships: '',
      contribution: '',
      career: '',
      health: '',
      personal: ''
    });
    removeUploadedImage();
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const progressMessages = [
    'Analyzing your life goals...',
    'Designing your dream life scenes...',
    'Creating high-quality visuals...',
    'Finalizing your vision board...'
  ];

  const handleDownload = async () => {
    if (!generatedImageUrl) return;

    try {
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vision-board.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download image');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" ref={resultRef}>
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Image className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold">Vision Board Generator</h1>
            </div>
            <p className="text-amber-100 text-lg">
              Create a personalized, powerful vision board based on your life goals
            </p>
          </div>

          <div className="p-8">
            {!generatedImageUrl ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 rounded-xl p-6">
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    Upload Your Photo (Optional)
                  </label>
                  <p className="text-sm text-gray-600 mb-2">
                    Upload your photo to personalize your vision board
                  </p>
                  <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 mb-4">
                    <p className="text-xs text-amber-900 leading-relaxed">
                      Your vision board will be personalized based on your photo.
                      Exact face replication may vary, but overall style and identity will be preserved.
                    </p>
                  </div>

                  {!uploadedImage ? (
                    <div
                      onClick={() => !generating && fileInputRef.current?.click()}
                      className={`bg-white border-2 border-dashed border-amber-300 rounded-lg p-8 text-center transition-all ${
                        generating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-amber-500 hover:bg-amber-50'
                      }`}
                    >
                      <Upload className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                      <p className="text-gray-700 font-medium mb-1">Click to upload image</p>
                      <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                    </div>
                  ) : (
                    <div className="relative bg-white rounded-lg p-4 border-2 border-amber-300">
                      <button
                        type="button"
                        onClick={removeUploadedImage}
                        disabled={generating}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <img
                        src={uploadedImage}
                        alt="Uploaded preview"
                        className="max-h-48 mx-auto rounded-lg object-cover"
                      />
                      <p className="text-sm text-gray-600 text-center mt-3 truncate">{uploadedFileName}</p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={generating}
                    className="hidden"
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    1. Financial / Income Goals
                  </label>
                  <textarea
                    value={formData.financial}
                    onChange={(e) => handleInputChange('financial', e.target.value)}
                    disabled={generating}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                    placeholder="e.g., Earn $100K/year, become debt-free, save for investment property..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    2. Fun / Travel / Lifestyle
                  </label>
                  <textarea
                    value={formData.fun}
                    onChange={(e) => handleInputChange('fun', e.target.value)}
                    disabled={generating}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                    placeholder="e.g., Travel to Italy, learn to surf, attend concerts, weekend getaways..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    3. Relationships / Family
                  </label>
                  <textarea
                    value={formData.relationships}
                    onChange={(e) => handleInputChange('relationships', e.target.value)}
                    disabled={generating}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                    placeholder="e.g., Stronger marriage, quality time with kids, reconnect with friends..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    4. Contribution / Legacy
                  </label>
                  <textarea
                    value={formData.contribution}
                    onChange={(e) => handleInputChange('contribution', e.target.value)}
                    disabled={generating}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                    placeholder="e.g., Volunteer work, mentor others, charity donations, make an impact..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    5. Career / Business Goals
                  </label>
                  <textarea
                    value={formData.career}
                    onChange={(e) => handleInputChange('career', e.target.value)}
                    disabled={generating}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                    placeholder="e.g., Get promoted, start a business, become a speaker, publish a book..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    6. Health / Fitness
                  </label>
                  <textarea
                    value={formData.health}
                    onChange={(e) => handleInputChange('health', e.target.value)}
                    disabled={generating}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                    placeholder="e.g., Lose 20 lbs, run a marathon, yoga 3x/week, eat healthier..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    7. Personal Growth / Purchases
                  </label>
                  <textarea
                    value={formData.personal}
                    onChange={(e) => handleInputChange('personal', e.target.value)}
                    disabled={generating}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                    placeholder="e.g., Learn Spanish, buy dream car, home renovation, spiritual growth..."
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {!generating ? (
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-amber-700 hover:to-orange-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                  >
                    <Image className="w-5 h-5" />
                    Generate Vision Board
                  </button>
                ) : (
                  <div className="w-full bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-2xl p-12 shadow-inner">
                    <div className="flex flex-col items-center justify-center space-y-8">
                      <div className="relative">
                        <div className="absolute inset-0 w-20 h-20 bg-amber-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                        <Loader className="relative w-20 h-20 text-amber-600 animate-spin" strokeWidth={2.5} />
                      </div>

                      <div className="text-center space-y-3">
                        <h3 className="text-2xl font-bold text-gray-900">
                          Creating your personalized vision board...
                        </h3>
                        <p className="text-amber-700 font-semibold text-xl min-h-[2rem] transition-all duration-500">
                          {progressMessages[progressStep]}
                        </p>
                      </div>

                      <div className="bg-white rounded-xl px-8 py-4 border-2 border-amber-300 shadow-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">⏱</div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              Generating...
                            </p>
                            <p className="text-amber-600 font-mono font-bold text-2xl">
                              {elapsedTime}s
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-amber-100 border border-amber-300 rounded-lg px-6 py-3">
                        <p className="text-sm text-amber-900 font-medium text-center">
                          Usually takes 20–40 seconds
                        </p>
                      </div>

                      <div className="text-center text-sm text-gray-600 max-w-md bg-white/50 backdrop-blur-sm rounded-lg px-6 py-4 border border-gray-200">
                        <p className="leading-relaxed">
                          Please wait while we create your high-quality vision board. Do not refresh or leave this page.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Image
                  </button>
                  <button
                    onClick={handleGenerateNew}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate New
                  </button>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-amber-50 border border-gray-200 rounded-xl p-8">
                  <img
                    src={generatedImageUrl}
                    alt="Generated Vision Board"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

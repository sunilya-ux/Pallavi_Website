# OpenAI API Setup for Passion Coaching SMM

## Overview

The Passion Coaching SMM form now integrates with ChatGPT to generate personalized content strategies based on client responses.

## How It Works

1. **Client fills out the form** - Answers 7 questions about their coaching business
2. **Responses are saved** - Data is stored in the Supabase database
3. **ChatGPT generates content** - The responses are sent to OpenAI's API via a Supabase Edge Function
4. **Strategy is displayed** - The AI-generated content strategy appears below the form

## Setting Up the OpenAI API Key

To enable the ChatGPT integration, you need to configure your OpenAI API key:

### Step 1: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign in or create an account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (you won't be able to see it again)

### Step 2: Configure the Secret in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Edge Functions** → **Secrets**
4. Add a new secret:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** Your OpenAI API key from Step 1
5. Click "Save"

## Current Prompt Implementation

The "Passion Content Coach" prompt is now active and will generate:

1. **Weekly Content Plan** - Structured by day, pillar, and goal
2. **Full Post Content** with:
   - Video/Reel hooks (3 options per post)
   - Caption hooks (2-3 options per post)
   - Story-based caption body (120-250 words)
   - DM-focused CTAs
   - 10-15 hashtags per post
   - 10-15 SEO keywords per post

3. **Content Strategy** based on 5 pillars:
   - Pain & Awareness (stuck, confused, burnout)
   - Desire & Vision (clarity, meaningful work)
   - Proof & Stories (transformations)
   - Education & Framework (myths, explanations)
   - Invitation & Objection Handling (DMs, calls)

4. **Tone**: Warm, empathetic, big-sister energy with light Indian context

### Customizing the Prompt

The prompt template is located at:
`supabase/functions/generate-passion-coaching-content/index.ts`

Look for the `PROMPT_TEMPLATE` constant (starts around line 21).

**Available placeholders:**
- `{{audienceDescription}}`
- `{{idealClientDescription}}`
- `{{mainOffer}}`
- `{{promisedResult}}`
- `{{proofOrStory}}`
- `{{postsPerWeek}}`
- `{{preferredContentType}}`

Replace the entire template string with your own prompt while keeping the placeholders intact.

See `HOW_TO_CUSTOMIZE_PROMPT.md` for detailed customization instructions.

## Features

- **Real-time generation** - Content is generated instantly after form submission
- **Copy functionality** - One-click copy of the generated content
- **Regenerate option** - Generate a new strategy with the same inputs
- **Loading states** - Clear feedback during processing
- **Error handling** - User-friendly error messages

## Security

- The OpenAI API key is stored securely in Supabase secrets
- It is never exposed to the frontend
- All API calls go through the secure Edge Function
- JWT authentication is required to call the function

## Usage

1. Client logs into their dashboard
2. Clicks "Passion Coaching SMM"
3. Fills out the questionnaire
4. Clicks "Submit"
5. Waits for content generation (typically 5-15 seconds)
6. Reviews the generated strategy
7. Can copy or regenerate as needed

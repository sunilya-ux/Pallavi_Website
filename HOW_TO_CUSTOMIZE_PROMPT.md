# Passion Content Coach Prompt

## Current Implementation

The "Passion Content Coach" prompt has been implemented and is ready to use. It will generate structured Instagram content for passion coaches including:

- Weekly content plans
- Post hooks and captions
- Hashtags and keywords
- CTAs and engagement strategies

## How to Customize Further

To modify the ChatGPT prompt for the Passion Coaching SMM form:

### Step 1: Open the Edge Function File

Navigate to:
```
supabase/functions/generate-passion-coaching-content/index.ts
```

### Step 2: Find the PROMPT_TEMPLATE Constant

Look for this section near the top of the file (around line 20):

```typescript
// CUSTOMIZE THIS PROMPT TEMPLATE
// Replace with your own marketing prompt - use {{fieldName}} placeholders
const PROMPT_TEMPLATE = `Your prompt goes here...`;
```

### Step 3: Replace with Your Prompt

Replace the entire string between the backticks with your custom prompt.

### Step 4: Use Placeholders

Insert these placeholders wherever you want the form data to appear:

| Placeholder | Description |
|------------|-------------|
| `{{audienceDescription}}` | The target audience |
| `{{idealClientDescription}}` | Ideal client details |
| `{{mainOffer}}` | Main coaching offer |
| `{{promisedResult}}` | Promised result |
| `{{proofOrStory}}` | Proof or story |
| `{{postsPerWeek}}` | Number of posts per week |
| `{{preferredContentType}}` | Preferred content type |

### Example

```typescript
const PROMPT_TEMPLATE = `You are a social media expert.

Create a 30-day content calendar for:
- Audience: {{audienceDescription}}
- Target Client: {{idealClientDescription}}
- Offer: {{mainOffer}}

The client wants to post {{postsPerWeek}} times per week.
Their content preference is: {{preferredContentType}}

Generate specific post ideas, captions, and hashtags.`;
```

### Step 5: Deploy the Updated Function

After editing the file, the Edge Function will automatically redeploy with your new prompt.

## Tips

1. **Keep placeholders intact** - Don't change the placeholder format `{{fieldName}}`
2. **Test incrementally** - Start with a simple prompt and expand
3. **Structure matters** - Clear instructions to ChatGPT produce better results
4. **Specify output format** - Tell ChatGPT exactly how you want the response formatted
5. **Use examples** - Include examples in your prompt for better results

## Advanced: Adjusting ChatGPT Parameters

In the same file, you can also adjust:

- **Model**: Change `"gpt-4o"` to other models like `"gpt-4-turbo"` or `"gpt-3.5-turbo"`
- **Temperature**: Adjust `0.7` (0 = focused, 1 = creative)
- **Max Tokens**: Change `2000` to allow longer/shorter responses

```typescript
model: "gpt-4o",           // Model to use
temperature: 0.7,           // Creativity level
max_tokens: 2000,           // Response length limit
```

## Troubleshooting

**Issue**: Placeholders appear in output
- **Solution**: Make sure placeholder names match exactly (case-sensitive)

**Issue**: Response is cut off
- **Solution**: Increase `max_tokens` value

**Issue**: Response is too generic
- **Solution**: Add more specific instructions in your prompt

**Issue**: API errors
- **Solution**: Check that OpenAI API key is configured in Supabase secrets

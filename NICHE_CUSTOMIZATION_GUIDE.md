# Niche Customization Guide

## Overview

The Ad Lab application now supports niche-specific customization, allowing AI assistants to provide more targeted and relevant recommendations based on the user's business type. This feature enhances the quality of AI responses by incorporating industry-specific knowledge and best practices.

## Supported Niches

The system currently supports the following business niches:

### 1. E-commerce
- **Focus**: Conversion optimization and cart value increase
- **Specializations**: 
  - Product category optimization
  - Seasonal marketing strategies
  - Urgency and scarcity triggers
  - Mobile shopping optimization
  - Reviews and social proof integration

### 2. SaaS (Software as a Service)
- **Focus**: Problem-solving and ROI demonstration
- **Specializations**:
  - Freemium model optimization
  - Trial period strategies
  - Automation and time-saving benefits
  - Technical expertise and integrations
  - B2B sales and enterprise solutions

### 3. Infoproducts
- **Focus**: Transformation and results
- **Specializations**:
  - Expertise and authority building
  - Urgency and limited-time offers
  - Social proof and case studies
  - Price objection handling
  - Educational content optimization

### 4. B2B (Business to Business)
- **Focus**: ROI and business benefits
- **Specializations**:
  - Decision-maker targeting
  - Stakeholder communication
  - Reliability and support emphasis
  - Case studies and references
  - Long sales cycle management

### 5. Local Business
- **Focus**: Community trust and local presence
- **Specializations**:
  - Local community engagement
  - Reviews and recommendations
  - Quality and personalized service
  - Local urgency creation
  - Seasonal and local event marketing

### 6. Healthcare
- **Focus**: Safety and expertise
- **Specializations**:
  - Medical authority and trust
  - Treatment quality and results
  - Medical ethics compliance
  - Patient fears and hopes
  - Professional credibility

### 7. Education
- **Focus**: Skill development and career growth
- **Specializations**:
  - Learning motivation and goals
  - Practical applicability
  - Student success stories
  - Future investment messaging
  - Educational outcomes

### 8. Finance
- **Focus**: Security and stability
- **Specializations**:
  - Trust and reputation building
  - Expertise and experience
  - Financial regulation compliance
  - Risk and opportunity management
  - Financial security messaging

### 9. Real Estate
- **Focus**: Investment attractiveness
- **Specializations**:
  - Location and infrastructure
  - Unique property advantages
  - Good deal urgency
  - Emotional purchase aspects
  - Investment potential

### 10. Consulting
- **Focus**: Problem-solving and results
- **Specializations**:
  - Expertise and experience
  - Personalized approach
  - Project ROI and case studies
  - Long-term relationship building
  - Strategic value demonstration

## Technical Implementation

### Core Files

1. **`lib/ai-instructions.ts`**
   - Contains niche-specific instructions
   - Defines `NicheType` enum
   - Provides utility functions for instruction creation

2. **`components/niche-selector.tsx`**
   - Reusable niche selection component
   - Supports compact and full display modes
   - Includes visual feedback for selected niches

3. **`components/chat-interface.tsx`**
   - Updated to include niche selection
   - Passes niche information to API
   - Shows niche-specific UI indicators

4. **`app/api/chat/route.ts`**
   - Modified to handle niche parameter
   - Creates custom instructions with niche context
   - Enhances AI prompts with industry-specific knowledge

### Key Functions

#### `createCustomInstruction(baseType, niche?, additionalContext?)`
Creates a customized instruction by combining:
- Base instruction type (marketing, copywriting, etc.)
- Niche-specific specialization
- Additional context (optional)

#### `getAvailableNiches()`
Returns an array of available niches with labels for UI display.

#### `getNicheInstruction(niche)`
Retrieves the specific instruction text for a given niche.

## Usage Examples

### Basic Niche Selection
```typescript
import { NicheSelector } from '@/components/niche-selector';
import { useState } from 'react';

function MyComponent() {
  const [selectedNiche, setSelectedNiche] = useState<NicheType | ''>('');
  
  return (
    <NicheSelector 
      value={selectedNiche} 
      onValueChange={setSelectedNiche}
      showLabel={true}
    />
  );
}
```

### API Integration
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    message: userMessage,
    instructionType: 'marketing',
    niche: 'ecommerce' // Niche-specific customization
  }),
});
```

### Custom Instruction Creation
```typescript
import { createCustomInstruction } from '@/lib/ai-instructions';

const instruction = createCustomInstruction(
  'copywriting',
  'saas',
  'Focus on enterprise customers'
);
```

## UI Components

### NicheSelector
A dropdown component for selecting business niches with the following props:
- `value`: Current selected niche
- `onValueChange`: Callback for niche changes
- `placeholder`: Custom placeholder text
- `showLabel`: Whether to show a label above the selector
- `compact`: Compact display mode

### NicheBadge
A visual badge component displaying the selected niche:
- `niche`: The niche type to display
- Automatically shows appropriate icon and label

## Benefits

1. **Improved Accuracy**: AI responses are tailored to specific industry needs
2. **Better Relevance**: Recommendations consider industry-specific challenges
3. **Enhanced User Experience**: Users see immediate value in niche-specific advice
4. **Scalability**: Easy to add new niches or modify existing ones
5. **Consistency**: Standardized approach across all AI interactions

## Future Enhancements

1. **Dynamic Niche Detection**: Automatically detect user's niche based on input
2. **Niche-Specific Templates**: Pre-built templates for each industry
3. **Performance Analytics**: Track which niches perform best
4. **Custom Niche Creation**: Allow users to create custom niches
5. **Niche-Specific Pricing**: Different pricing tiers based on niche complexity

## Best Practices

1. **Always provide a "All niches" option** for general queries
2. **Use clear, industry-specific language** in niche descriptions
3. **Test niche instructions** with real user queries
4. **Keep niche instructions concise** but comprehensive
5. **Regularly update niche content** based on industry trends

## Troubleshooting

### Common Issues

1. **Niche not applying**: Check that the niche parameter is being passed correctly to the API
2. **Instructions not updating**: Verify that `createCustomInstruction` is being called with the correct parameters
3. **UI not reflecting selection**: Ensure the `NicheSelector` component is properly controlled

### Debug Steps

1. Check browser console for any JavaScript errors
2. Verify API request payload includes niche parameter
3. Confirm niche type matches the defined `NicheType` enum
4. Test with different instruction types and niches

## Conclusion

The niche customization feature significantly enhances the Ad Lab application's value proposition by providing industry-specific AI assistance. This implementation provides a solid foundation for future enhancements while maintaining code quality and user experience standards. 
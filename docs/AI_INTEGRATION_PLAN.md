# AI Integration Plan - AWS Bedrock

## Overview

Plan to add AI capabilities to the Materials Selection App to demonstrate future vision to client. Focus on practical, customer-data-driven AI features that learn from activity within the app.

## Architecture Decision: AWS Bedrock (Recommended)

### Why Bedrock Over SageMaker?

**AWS Bedrock - RECOMMENDED ✅**

- ✅ Serverless & Easy Integration - Works with existing Lambda + DynamoDB setup
- ✅ Pre-trained Foundation Models - Claude, Llama, etc. without ML expertise
- ✅ RAG (Retrieval Augmented Generation) - Learn from customer's historical data
- ✅ Bedrock Agents - Multi-step reasoning and action execution
- ✅ Cost-effective for demos - Pay per use, no infrastructure to manage
- ✅ Quick to prototype - Can build impressive demos in days, not months

**SageMaker - NOT RECOMMENDED ❌**

- ❌ Requires ML expertise to train custom models
- ❌ More expensive and complex infrastructure
- ❌ Longer development time
- ❌ Overkill - We don't need custom model training for business applications

**AWS Amplify - SKIP FOR NOW**

- ❌ Would require rearchitecting existing setup
- ❌ Already have good Lambda + DynamoDB + CloudFront stack
- ❌ Adds complexity without clear AI benefit

---

## Impressive AI Use Cases (Client Demo Ready)

### 1. Intelligent Product Recommendations

**Scenario:** _"Based on similar bathroom remodels, I recommend these products..."_

**Capabilities:**

- Analyzes historical projects with similar scope/category
- Suggests products, vendors, and pricing based on past successes
- Learns from completed projects to improve recommendations

**Technical Implementation:**

- Query DynamoDB for similar projects (by category, budget range)
- Pass historical data to Bedrock with context
- Generate personalized recommendations

**Demo Value:** Shows AI learning from their actual business data

---

### 2. Budget Optimization Agent

**Scenario:** _"I can save you $1,200 by switching to these alternative vendors..."_

**Capabilities:**

- Analyzes current project line items
- Finds cost savings by suggesting alternative vendors
- Maintains quality requirements while reducing cost
- Shows ROI: "Switch from Ferguson to Home Depot on these 5 items"

**Technical Implementation:**

- Load current project + line items
- Query product-vendor relationships for alternatives
- Use Bedrock to analyze and recommend optimal vendor mix

**Demo Value:** Direct dollar savings = immediate business value

---

### 3. Natural Language Project Assistant

**Scenario:** _User types: "Show me all kitchen projects over $50k with granite countertops"_

**Capabilities:**

- Chat interface to query project database
- No need to navigate complex UI - just ask
- Generates reports and insights on demand
- Natural conversation: "Now show me which vendors we used most"

**Technical Implementation:**

- Chat UI component (floating bubble)
- Bedrock converts natural language to DynamoDB queries
- Returns formatted results with context

**Demo Value:** Modern, intuitive interface clients expect

---

### 4. Smart Vendor Selection

**Scenario:** _"Ferguson is your best vendor for this project because..."_

**Capabilities:**

- Analyzes vendor history across all projects
- Considers pricing, past delivery performance, product availability
- Recommends optimal vendor mix per project
- Learns from vendor performance patterns

**Technical Implementation:**

- Aggregate vendor statistics from orders/receipts
- Pass vendor performance data to Bedrock
- Generate vendor scorecards and recommendations

**Demo Value:** Data-driven vendor decisions

---

### 5. Automated Material Takeoffs (Future Phase)

**Scenario:** _Upload floor plans → AI generates material list_

**Capabilities:**

- (Future) Analyze PDFs/images of floor plans
- Extract quantities and specifications
- Generate initial line items automatically
- User reviews and adjusts

**Technical Implementation:**

- Bedrock with vision capabilities (Claude 3)
- PDF parsing and image analysis
- Map specifications to product catalog

**Demo Value:** Huge time saver, wow factor

---

### 6. Predictive Pricing

**Scenario:** _"Based on market trends, expect 8% price increase in 3 months..."_

**Capabilities:**

- Analyzes historical pricing data from receipts/orders
- Identifies price trends by product category
- Warns about price volatility
- Suggests optimal ordering timing

**Technical Implementation:**

- Time-series analysis of order/receipt costs
- Bedrock analyzes patterns and makes predictions
- Alert system for significant price changes

**Demo Value:** Proactive cost management

---

## Implementation Phases

### Phase 1: Basic Chat Assistant (1-2 Days) - DEMO READY

**Goal:** Working AI chat interface using existing project data

**Steps:**

1. Enable Bedrock in AWS Console (us-east-1)
2. Request model access (Claude 3 Sonnet)
3. Add Bedrock SDK to Lambda
4. Create `/ai/chat` endpoint
5. Build React chat UI component (floating bubble)
6. Demo: Ask questions about projects, get AI responses

**Code Sketch:**

```typescript
// Lambda handler
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

async function handleAIChat(question: string, projectId?: string) {
  // Load relevant context from DynamoDB
  const projectContext = projectId ? await getProjectContext(projectId) : {};

  const prompt = `You are an expert assistant for a construction materials selection application.

Project Context: ${JSON.stringify(projectContext, null, 2)}

User Question: ${question}

Provide helpful, specific recommendations based on the project data.`;

  const response = await bedrockClient.send(
    new InvokeModelCommand({
      modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    }),
  );

  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  return responseBody.content[0].text;
}
```

**React Component:**

```typescript
// ChatAssistant.tsx
const ChatAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const sendMessage = async () => {
    const response = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      body: JSON.stringify({ question: input, projectId })
    });
    const aiResponse = await response.json();
    setMessages([...messages,
      { role: 'user', content: input },
      { role: 'assistant', content: aiResponse.answer }
    ]);
  };

  return (
    <div className="fixed bottom-4 right-4">
      {/* Floating chat bubble UI */}
    </div>
  );
};
```

**Deliverable:** Working chat that can answer questions about projects

---

### Phase 2: RAG with Historical Data (1 Week)

**Goal:** AI learns from ALL customer's historical data

**Steps:**

1. Set up **Knowledge Bases for Amazon Bedrock**
2. Index all projects, line items, vendors, products
3. Configure vector embeddings
4. Connect knowledge base to chat endpoint
5. AI can now answer: _"What did we pay for Kohler toilets last year?"_

**Technical Details:**

- Use **Amazon OpenSearch Serverless** as vector store
- Sync DynamoDB data to knowledge base (Lambda trigger)
- Bedrock automatically retrieves relevant context

**Deliverable:** AI with comprehensive memory of all business data

---

### Phase 3: Bedrock Agents (2 Weeks)

**Goal:** AI can execute multi-step tasks autonomously

**Steps:**

1. Define Bedrock Agent with action groups
2. Agent can call existing Lambda functions
3. Multi-step reasoning: _"Find the cheapest way to furnish 5 bathrooms"_
4. Agent orchestrates: query products → compare vendors → generate report

**Technical Details:**

- Action Group: Link agent to existing API endpoints
- Agent decides which endpoints to call
- Executes complex workflows without explicit programming

**Example Agent Capabilities:**

- "Create a new project for a kitchen remodel with $30K budget"
- "Find all products we've ordered from Ferguson in the past 6 months"
- "Compare total project costs between 2023 and 2024"

**Deliverable:** Autonomous AI assistant that can perform tasks

---

## Cost Estimates

### Phase 1 Demo (Basic Chat)

**AWS Bedrock - Claude 3 Sonnet:**

- Input: $0.003 per 1K tokens (~750 words)
- Output: $0.015 per 1K tokens
- **Estimated: $5-20/month** for demo/light usage
- Example: 1000 questions/month = ~$15

**Compare to SageMaker:**

- Hosted endpoint: $100-500/month minimum
- Training: $50-200 per training run
- **Much more expensive for demo purposes**

### Phase 2 (RAG with Knowledge Base)

- OpenSearch Serverless: ~$50-100/month
- Bedrock + KB queries: ~$20-40/month
- **Total: $70-140/month**

### Phase 3 (Agents)

- Agent orchestration: ~$30-60/month
- **Total with all features: $100-200/month**

**All phases combined still cheaper than basic SageMaker deployment**

---

## AWS Setup Checklist

### Prerequisites (To Complete Before Implementation)

- [ ] AWS Account with Bedrock access (us-east-1)
- [ ] Request model access in Bedrock console
  - [ ] Anthropic Claude 3 Sonnet
  - [ ] (Optional) Claude 3 Haiku (faster/cheaper)
- [ ] Update Lambda IAM role with Bedrock permissions
- [ ] Install Bedrock SDK in Lambda layer

### IAM Policy Needed

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"
    }
  ]
}
```

---

## Demo Scenarios for Client

### Scenario 1: Product Recommendation

1. Open existing bathroom remodel project
2. Click AI assistant chat bubble
3. Ask: "What products would you recommend for this bathroom based on similar past projects?"
4. AI analyzes historical data and suggests specific products with reasoning

### Scenario 2: Cost Optimization

1. View project with multiple line items
2. Ask AI: "Can you find ways to reduce costs on this project?"
3. AI analyzes vendor alternatives and suggests specific swaps
4. Shows potential savings: "$850 by switching 3 items to alternative vendors"

### Scenario 3: Natural Language Query

1. Ask: "Show me all projects over $50K in the last year"
2. AI generates formatted list with totals
3. Follow-up: "Which vendors did we use most?"
4. AI provides vendor breakdown with statistics

### Scenario 4: Smart Vendor Selection

1. Starting new project
2. Ask: "Which vendor should I use for plumbing fixtures?"
3. AI recommends based on past pricing, delivery performance, product availability
4. Provides reasoning: "Ferguson has best prices on Kohler and 98% on-time delivery rate"

**Each scenario demonstrates tangible business value using their own data**

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ChatAssistant Component (floating bubble)       │  │
│  │  - Message history                               │  │
│  │  - Input field                                   │  │
│  │  - Streaming responses (future)                  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│              API Gateway + Lambda (Existing)            │
│  ┌──────────────────────────────────────────────────┐  │
│  │  New Route: POST /ai/chat                        │  │
│  │  - Validates request                             │  │
│  │  - Loads project context from DynamoDB           │  │
│  │  - Calls Bedrock with enriched prompt            │  │
│  │  - Returns AI response                           │  │
│  └──────────────────────────────────────────────────┘  │
└───────┬────────────────────────────────┬────────────────┘
        │                                │
        ▼                                ▼
┌──────────────────┐          ┌──────────────────────────┐
│    DynamoDB      │          │     AWS Bedrock          │
│  (Existing)      │          │  ┌────────────────────┐  │
│  - Projects      │          │  │ Claude 3 Sonnet    │  │
│  - LineItems     │          │  │ Foundation Model   │  │
│  - Products      │          │  └────────────────────┘  │
│  - Vendors       │          │                          │
│  - ProductVendors│          │  (Phase 2: + Knowledge   │
│                  │          │   Base for RAG)          │
└──────────────────┘          └──────────────────────────┘
```

---

## Next Session Immediate Tasks

1. **AWS Console Setup (10 min)**
   - Navigate to Bedrock console (us-east-1)
   - Request Claude 3 Sonnet model access
   - Wait for approval (usually instant)

2. **Lambda Preparation (30 min)**
   - Add Bedrock SDK to dependencies
   - Update IAM role permissions
   - Create `/ai/chat` endpoint stub

3. **Basic Integration Test (30 min)**
   - Simple "Hello World" Bedrock call
   - Verify SDK works from Lambda
   - Test with hardcoded prompt

4. **Chat UI Scaffold (1 hour)**
   - Create ChatAssistant.tsx component
   - Floating bubble in bottom-right
   - Basic message display

5. **First Working Demo (2 hours)**
   - Connect UI to Lambda endpoint
   - Pass project context to AI
   - Display AI responses
   - **DEMO READY**

**Total estimated time: 4-5 hours to working demo**

---

## Success Metrics

**Demo Success = Client sees value in:**

1. ✅ AI using their actual project data (not generic responses)
2. ✅ Practical cost-saving recommendations
3. ✅ Time-saving through natural language queries
4. ✅ Learning from historical patterns
5. ✅ Modern, intuitive chat interface

**Technical Success:**

- Response time < 3 seconds
- Accurate recommendations based on data
- No errors/hallucinations in demo
- Clean, professional UI

---

## Future Enhancements (Post-Demo)

- **Streaming responses** - Show AI "thinking" in real-time
- **Voice input** - Speak questions instead of typing
- **Document analysis** - Upload invoices/quotes for AI analysis
- **Automated reporting** - "Generate end-of-month report"
- **Predictive ordering** - "Order these items before price increase"
- **Integration alerts** - Proactive notifications about cost anomalies

---

## Resources & Documentation

**AWS Bedrock:**

- [Bedrock Developer Guide](https://docs.aws.amazon.com/bedrock/)
- [Claude 3 on Bedrock](https://docs.anthropic.com/claude/docs/claude-on-amazon-bedrock)
- [Knowledge Bases for Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html)
- [Bedrock Agents](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)

**SDK:**

- [@aws-sdk/client-bedrock-runtime](https://www.npmjs.com/package/@aws-sdk/client-bedrock-runtime)

**Pricing:**

- [Bedrock Pricing Calculator](https://aws.amazon.com/bedrock/pricing/)

---

## Questions to Consider Before Starting

1. **Which use case to demo first?**
   - Recommend: Product Recommendations (most impressive, uses all data types)

2. **Model choice?**
   - Start: Claude 3 Sonnet (good balance of quality/cost)
   - Future: Haiku for simple queries (faster/cheaper)

3. **UI placement?**
   - Recommend: Floating chat bubble (bottom-right, non-intrusive)
   - Alternative: Sidebar panel

4. **Context scope?**
   - Start: Current project only
   - Expand: All customer's historical data

5. **Response format?**
   - Conversational text
   - Structured JSON (for actionable recommendations)
   - Both (natural language + data)

---

## Ready to Start Next Session

This document provides complete roadmap for AI integration. Next session we can:

1. Enable Bedrock and request model access (5 min)
2. Implement basic chat endpoint (1 hour)
3. Build chat UI component (1 hour)
4. Test with real project data (30 min)
5. **Have working demo** (4-5 hours total)

All technical details, code examples, and decision rationale documented above.

**Status: Ready for implementation** ✅

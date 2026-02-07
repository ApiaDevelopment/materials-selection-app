import type { OpportunityDetails, SalesforceOpportunity } from "../types";

// TODO: Update this to point to the new Salesforce Lambda API (separate from MaterialSelection-API)
// This will be a dedicated Lambda function for Salesforce integration
const SF_API_BASE_URL =
  import.meta.env.VITE_SF_API_URL ||
  "https://your-sf-api-url.execute-api.us-east-1.amazonaws.com/prod";

export const salesforceService = {
  /**
   * Fetch all Salesforce Opportunities where Selection_Coordinator_Needed__c = true
   */
  getOpportunities: async (): Promise<SalesforceOpportunity[]> => {
    try {
      const response = await fetch(
        `${SF_API_BASE_URL}/salesforce/opportunities`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch opportunities: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data.opportunities || [];
    } catch (error) {
      console.error("Error fetching Salesforce opportunities:", error);
      throw error;
    }
  },

  /**
   * Fetch detailed information for a specific Opportunity
   * Includes Account (BillingAddress) and Contact information
   */
  getOpportunityDetails: async (
    opportunityId: string,
  ): Promise<OpportunityDetails> => {
    try {
      const response = await fetch(
        `${SF_API_BASE_URL}/salesforce/opportunities/${opportunityId}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch opportunity details: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching Salesforce opportunity details:", error);
      throw error;
    }
  },
};

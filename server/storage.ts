import { 
  comparisons, 
  searchSessions,
  highlights,
  type Comparison, 
  type InsertComparison,
  type SearchSession,
  type InsertSearchSession,
  type Highlight,
  type InsertHighlight
} from "@shared/schema";

export interface IStorage {
  // Comparison operations
  createComparison(comparison: InsertComparison): Promise<Comparison>;
  getComparison(id: number): Promise<Comparison | undefined>;
  
  // Search session operations
  createSearchSession(session: InsertSearchSession): Promise<SearchSession>;
  getSearchSession(sessionId: string): Promise<SearchSession | undefined>;
  updateSearchSession(sessionId: string, updates: Partial<InsertSearchSession>): Promise<SearchSession | undefined>;
  
  // Highlight operations
  createHighlight(highlight: InsertHighlight): Promise<Highlight>;
  getHighlightsByComparisonId(comparisonId: number): Promise<Highlight[]>;
  deleteHighlight(id: number): Promise<boolean>;
  deleteHighlightsByComparisonId(comparisonId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private comparisons: Map<number, Comparison>;
  private searchSessions: Map<string, SearchSession>;
  private highlights: Map<number, Highlight>;
  private currentComparisonId: number;
  private currentSessionId: number;
  private currentHighlightId: number;

  constructor() {
    this.comparisons = new Map();
    this.searchSessions = new Map();
    this.highlights = new Map();
    this.currentComparisonId = 1;
    this.currentSessionId = 1;
    this.currentHighlightId = 1;
  }

  async createComparison(insertComparison: InsertComparison): Promise<Comparison> {
    const id = this.currentComparisonId++;
    const comparison: Comparison = { 
      id,
      articleTitle: insertComparison.articleTitle,
      selectedLanguages: insertComparison.selectedLanguages,
      outputLanguage: insertComparison.outputLanguage,
      comparisonResult: insertComparison.comparisonResult || null,
      isFunnyMode: insertComparison.isFunnyMode || null,
      createdAt: new Date()
    };
    this.comparisons.set(id, comparison);
    return comparison;
  }

  async getComparison(id: number): Promise<Comparison | undefined> {
    return this.comparisons.get(id);
  }

  async createSearchSession(insertSession: InsertSearchSession): Promise<SearchSession> {
    const id = this.currentSessionId++;
    const session: SearchSession = { 
      id,
      sessionId: insertSession.sessionId,
      searchQuery: insertSession.searchQuery || null,
      selectedArticle: insertSession.selectedArticle || null,
      availableLanguages: insertSession.availableLanguages || null,
      createdAt: new Date()
    };
    this.searchSessions.set(insertSession.sessionId, session);
    return session;
  }

  async getSearchSession(sessionId: string): Promise<SearchSession | undefined> {
    return this.searchSessions.get(sessionId);
  }

  async updateSearchSession(sessionId: string, updates: Partial<InsertSearchSession>): Promise<SearchSession | undefined> {
    const existing = this.searchSessions.get(sessionId);
    if (!existing) return undefined;
    
    const updated: SearchSession = { ...existing, ...updates };
    this.searchSessions.set(sessionId, updated);
    return updated;
  }

  async createHighlight(insertHighlight: InsertHighlight): Promise<Highlight> {
    const id = this.currentHighlightId++;
    const highlight: Highlight = {
      id,
      comparisonId: insertHighlight.comparisonId,
      startOffset: insertHighlight.startOffset,
      endOffset: insertHighlight.endOffset,
      color: insertHighlight.color,
      excerpt: insertHighlight.excerpt,
      createdAt: new Date()
    };
    this.highlights.set(id, highlight);
    return highlight;
  }

  async getHighlightsByComparisonId(comparisonId: number): Promise<Highlight[]> {
    const results: Highlight[] = [];
    this.highlights.forEach((highlight) => {
      if (highlight.comparisonId === comparisonId) {
        results.push(highlight);
      }
    });
    return results.sort((a, b) => a.startOffset - b.startOffset);
  }

  async deleteHighlight(id: number): Promise<boolean> {
    return this.highlights.delete(id);
  }

  async deleteHighlightsByComparisonId(comparisonId: number): Promise<boolean> {
    const toDelete: number[] = [];
    this.highlights.forEach((highlight, id) => {
      if (highlight.comparisonId === comparisonId) {
        toDelete.push(id);
      }
    });
    toDelete.forEach(id => this.highlights.delete(id));
    return toDelete.length > 0;
  }
}

export const storage = new MemStorage();

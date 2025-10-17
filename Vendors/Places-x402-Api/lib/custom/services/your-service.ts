/**
 * Your Custom Service Implementation
 *
 * This is where you implement your business logic and integrate with external APIs
 * Replace this template with your actual service implementation
 */

export interface SearchParams {
  query: string;
  category?: string;
  limit: number;
  page: number;
  sort_by: string;
  order: string;
}

export interface SearchResult {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total_pages: number;
    total_results: number;
  };
}

export interface CreateUpdateParams {
  id?: string;
  name: string;
  description: string;
  category: string;
  tags?: string[];
  attributes?: Record<string, any>;
}

export interface CreateUpdateResult {
  data: any;
  operation: 'created' | 'updated';
}

export class YourService {
  private static instance: YourService;

  private constructor() {
    // Initialize your service here
    // e.g., connect to database, set up API clients, etc.
    console.log('✅ YourService initialized');
  }

  public static getInstance(): YourService {
    if (!YourService.instance) {
      YourService.instance = new YourService();
    }
    return YourService.instance;
  }

  /**
   * Search for resources
   * Replace this with your actual search implementation
   */
  public async search(params: SearchParams): Promise<SearchResult> {
    // TODO: Implement your search logic here
    // This is just a mock example

    console.log('🔍 Searching with params:', params);

    // Example: Call your external API or database
    // const results = await yourExternalAPI.search(params);

    // Mock response for template
    const mockData = Array.from({ length: params.limit }, (_, i) => ({
      id: `res_${params.page}_${i}`,
      name: `Resource ${i + 1}`,
      description: `Description for ${params.query}`,
      category: params.category || 'type-a',
      tags: ['example', 'mock'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    return {
      data: mockData,
      pagination: {
        page: params.page,
        limit: params.limit,
        total_pages: 10, // Replace with actual total pages
        total_results: 100 // Replace with actual total results
      }
    };
  }

  /**
   * Get resource by ID
   * Replace this with your actual implementation
   */
  public async getById(id: string, includeMetadata: boolean = false): Promise<any | null> {
    // TODO: Implement your get-by-id logic here
    // This is just a mock example

    console.log(`📋 Fetching resource: ${id}, include_metadata: ${includeMetadata}`);

    // Example: Fetch from your database or external API
    // const resource = await yourDatabase.findById(id);

    // Mock response for template
    return {
      id,
      name: `Resource ${id}`,
      description: 'Resource description',
      category: 'type-a',
      tags: ['example', 'mock'],
      attributes: {
        custom_field_1: 'value1',
        custom_field_2: 'value2'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(includeMetadata && {
        metadata: {
          author: 'Your Organization',
          version: '1.0',
          license: 'MIT'
        }
      })
    };
  }

  /**
   * Create or update resource
   * Replace this with your actual implementation
   */
  public async createOrUpdate(params: CreateUpdateParams): Promise<CreateUpdateResult> {
    // TODO: Implement your create/update logic here
    // This is just a mock example

    const isUpdate = !!params.id;
    console.log(`✏️ ${isUpdate ? 'Updating' : 'Creating'} resource`);

    // Example: Save to your database
    // const result = await yourDatabase.save(params);

    // Mock response for template
    const resourceId = params.id || `res_${Date.now()}`;

    return {
      data: {
        id: resourceId,
        name: params.name,
        description: params.description,
        category: params.category,
        tags: params.tags || [],
        attributes: params.attributes || {},
        created_at: isUpdate ? new Date(Date.now() - 86400000).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      operation: isUpdate ? 'updated' : 'created'
    };
  }

  /**
   * Validate request parameters
   * Add your custom validation logic here
   */
  public validateSearchParams(params: SearchParams): string[] {
    const errors: string[] = [];

    if (!params.query || params.query.length === 0) {
      errors.push('query is required');
    }

    if (params.limit < 1 || params.limit > 100) {
      errors.push('limit must be between 1 and 100');
    }

    if (params.page < 1) {
      errors.push('page must be at least 1');
    }

    return errors;
  }
}

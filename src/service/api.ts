import axios, { AxiosResponse } from 'axios';

// API base configuration
const API_BASE_URL = 'http://192.168.1.7:3000';

// Project interface based on the actual API response structure
export interface Project {
  id: number;
  client_name: string;
  country: string;
  description: string;
  email: string;
  end_date: string;
  kloc: number;
  phone_no: string;
  project_id: string;
  project_name: string;
  project_status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  start_date: string;
  state: string;
  user_id: number;
}

// Extended interface for UI compatibility
export interface UIProject {
  id: string;
  name: string;
  risk: 'High' | 'Medium' | 'Low';
  defectDensity: number;
  totalDefects: number;
  linesOfCode: number;
  client_name: string;
  project_status: string;
  description: string;
}

// API response interface
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Error interface
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Project API class
class ProjectAPI {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Transform API project data to UI-compatible format
   * @param projects - Raw API projects
   * @returns UIProject[] - Transformed projects for UI
   */
  private transformProjectsToUI(projects: Project[]): UIProject[] {
    return projects.map(project => {
      // Calculate risk based on project status and KLOC
      let risk: 'High' | 'Medium' | 'Low' = 'Medium';
      if (project.project_status === 'ON_HOLD') {
        risk = 'High';
      } else if (project.project_status === 'COMPLETED') {
        risk = 'Low';
      } else if (project.kloc > 150) {
        risk = 'High';
      } else if (project.kloc < 100) {
        risk = 'Low';
      }

      // Calculate defect density (defects per KLOC) - using a sample calculation
      const defectDensity = Math.round((Math.random() * 20 + 5) * 10) / 10; // 5-25 defects per KLOC
      const totalDefects = Math.round(project.kloc * defectDensity);

      return {
        id: project.project_id,
        name: project.project_name,
        risk,
        defectDensity,
        totalDefects,
        linesOfCode: project.kloc * 1000, // Convert KLOC to lines
        client_name: project.client_name,
        project_status: project.project_status,
        description: project.description,
      };
    });
  }

  /**
   * Fetch all projects from the API
   * @returns Promise<UIProject[]> - Array of UI-compatible projects
   */
  async getProjects(): Promise<UIProject[]> {
    try {
      const response: AxiosResponse<ApiResponse<Project[]>> = await axios.get(
        `${this.baseURL}/api/projects`,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      if (response.data.success) {
        const transformedProjects = this.transformProjectsToUI(response.data.data);
        console.log('API Response:', response.data);
        console.log('Transformed Projects:', transformedProjects);
        return transformedProjects;
      } else {
        throw new Error(response.data.message || 'Failed to fetch projects');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout - please check your connection');
        }
        if (error.response) {
          const status = error.response.status;
          const message = error.response.data?.message || `HTTP ${status} error`;
          throw new Error(message);
        } else if (error.request) {
          throw new Error('No response from server - please check your connection');
        }
      }
      throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  /**
   * Fetch a single project by ID
   * @param id - Project ID
   * @returns Promise<UIProject> - Single UI-compatible project
   */
  async getProjectById(id: string): Promise<UIProject> {
    try {
      const response: AxiosResponse<ApiResponse<Project>> = await axios.get(
        `${this.baseURL}/api/projects/${id}`,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      if (response.data.success) {
        const transformedProjects = this.transformProjectsToUI([response.data.data]);
        return transformedProjects[0];
      } else {
        throw new Error(response.data.message || 'Failed to fetch project');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Project not found');
        }
        throw new Error(error.response?.data?.message || 'Failed to fetch project');
      }
      throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  /**
   * Test API connection
   * @returns Promise<boolean> - True if connection successful
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/api/projects`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const projectAPI = new ProjectAPI();

// Export the class for custom instances
export default ProjectAPI;

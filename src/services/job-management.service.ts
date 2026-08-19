import { JobRepository, JobWithProject } from "../repositories/job.repository";
import { JobSelect } from "../db/schema";
import { cancelPendingJob } from "./job-queue.service";

export class JobManagementService {
  private jobRepo: JobRepository;

  constructor(jobRepo = new JobRepository()) {
    this.jobRepo = jobRepo;
  }

  async getJobById(id: string): Promise<JobSelect | null> {
    return this.jobRepo.findById(id);
  }

  async listAllJobs(limit: number, offset: number): Promise<{ jobs: JobWithProject[]; total: number; limit: number; offset: number }> {
    const [total, jobs] = await Promise.all([
      this.jobRepo.countAll(),
      this.jobRepo.listAllWithProject(limit, offset),
    ]);
    return { jobs, total, limit, offset };
  }

  async listProjectJobs(projectId: string, limit: number, offset: number): Promise<{ jobs: JobSelect[]; total: number; limit: number; offset: number }> {
    const [total, jobs] = await Promise.all([
      this.jobRepo.countByProjectId(projectId),
      this.jobRepo.listByProjectId(projectId, limit, offset),
    ]);
    return { jobs, total, limit, offset };
  }

  async cancelJob(jobId: string): Promise<{ success: boolean; job: JobSelect | null }> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      return { success: false, job: null };
    }

    if (job.status === "PENDING") {
      await cancelPendingJob(jobId);
    }
    
    const updatedJob = await this.jobRepo.findById(jobId);
    return { success: true, job: updatedJob ?? job };
  }
}

export const jobManagementService = new JobManagementService();

import { ApplicationModel, IApplication } from "../models/application.model";
import { CreateApplicationDto } from "../dtos/application.dto";

export class ApplicationRepository {
    async create(musicianId: string, data: CreateApplicationDto): Promise<IApplication> {
        const application = new ApplicationModel({
            musicianId,
            ...data,
        });
        return await application.save();
    }

    async findById(id: string): Promise<IApplication | null> {
        return await ApplicationModel.findById(id).populate([
            {
                path: "musicianId",
                populate: { path: "userId", select: "username email" }
            },
            {
                path: "gigId",
                populate: {
                    path: "organizerId",
                    populate: { path: "userId", select: "username email" }
                }
            }
        ]);
    }

    async findByGigId(gigId: string): Promise<IApplication[]> {
        return await ApplicationModel.find({ gigId })
            .populate({
                path: "musicianId",
                populate: { path: "userId", select: "username email" }
            })
            .sort({ createdAt: -1 });
    }

    async findByMusicianId(musicianId: string): Promise<IApplication[]> {
        return await ApplicationModel.find({ musicianId })
            .populate("gigId")
            .sort({ createdAt: -1 });
    }

    async updateStatus(id: string, status: string): Promise<IApplication | null> {
        return await ApplicationModel.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );
    }

    async findOne(filter: object): Promise<IApplication | null> {
        return await ApplicationModel.findOne(filter);
    }
}

import mongoose from "mongoose";
import dotenv from "dotenv";
import sharp from "sharp";

// Adjust path assumption based on execution directory
dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");
    } catch (error) {
        console.error("Connection failed:", error.message);
        process.exit(1);
    }
};

// We only specify the structure we need to touch from Profile to safely use .cursor() and avoid heavy validations
const profileSchema = new mongoose.Schema({
    photo: String,
}, { strict: false });

const Profile = mongoose.model("Profile", profileSchema);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const compressProfiles = async () => {
    await connectDB();
    console.log("Starting legacy base64 profile compression migration...");

    try {
        let processedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        // Use a cursor to prevent loading all massive profiles into RAM at once causing OOM
        const cursor = Profile.find({ photo: { $exists: true, $ne: "" } }).cursor();

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            if (!doc.photo || !doc.photo.startsWith("data:image")) {
                skippedCount++;
                continue;
            }

            // Characters > 133,000 represents approx 100KB raw file size.
            // We skip already optimized small images.
            if (doc.photo.length < 133000) {
                skippedCount++;
                continue;
            }

            try {
                // Extract base64 payload cleanly
                const matches = doc.photo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (!matches || matches.length !== 3) {
                    skippedCount++;
                    continue;
                }

                const imageBuffer = Buffer.from(matches[2], 'base64');

                // Resize to max 250px dimension and push as optimized JPEG
                const compressedBuffer = await sharp(imageBuffer)
                    .resize({ width: 250, height: 250, fit: "inside", withoutEnlargement: true })
                    .jpeg({ quality: 80 })
                    .toBuffer();

                const newBase64 = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;

                console.log(`- Profile ${doc._id}: Compressed string from ${(doc.photo.length / 1024).toFixed(2)}KB -> ${(newBase64.length / 1024).toFixed(2)}KB.`);

                // Update exclusively the photo field directly in the engine natively
                await Profile.updateOne({ _id: doc._id }, { $set: { photo: newBase64 } });
                processedCount++;

                // Prevent database I/O saturation in production loop
                await delay(50);
            } catch (err) {
                console.error(`Error processing profile ${doc._id}: ${err.message}`);
                errorCount++;
            }
        }

        console.log("\n--- Migration Complete ---");
        console.log(`Processed & Compressed: ${processedCount}`);
        console.log(`Skipped (Small/Invalid): ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);

    } catch (err) {
        console.error("Migration fatal error:", err);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

compressProfiles();

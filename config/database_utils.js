// database_utils.js

const mysql = require('mysql2/promise');
const dbConfig = require('./db_config');
const { createConnection } = require('./db_config');
connection = await createConnection();
 // Assuming it's in config/db_config.js

// Function to update a tour's start time
async function updateTourStartTime(tourId, newStartTime) {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
       //onsole.log(`DB: Connected to database.`);

        // Format newStartTime for 'tour_date' (YYYY-MM-DD)
        const formattedDate = newStartTime.toISOString().slice(0, 10); // "YYYY-MM-DD"

        // Format newStartTime for 'tour_time' (HH:MM:SS)
        const formattedTime = newStartTime.toTimeString().slice(0, 8); // "HH:MM:SS"

        const query = `UPDATE tours SET tour_date = ?, tour_time = ? WHERE id = ?`;
        const [rows] = await connection.execute(query, [formattedDate, formattedTime, tourId]);

        if (rows.affectedRows > 0) {
            console.log(`DB: Tour ${tourId} start date updated to ${formattedDate} and time to ${formattedTime}.`);
            return true;
        } else {
            console.log(`DB: No tour found with ID ${tourId} or time/date were already set.`);
            return false;
        }
    } catch (error) {
        console.error('DB: Error updating tour start time:', error);
        throw error; // Re-throw to be caught by the main test function
    } finally {
        if (connection) {
            await connection.end();
            console.log(`DB: Disconnected from database.`);
        }
    }
}

// Function to get a tour ID by title
async function getTourIdByTitle(tourTitle) {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
     // console.log(`DB: Connected to database for getTourIdByTitle.`);
        const [rows] = await connection.execute('SELECT id FROM tours WHERE title = ?', [tourTitle]);
        if (rows.length > 0) {
            console.log(`DB: Found tour ID ${rows[0].id} for title "${tourTitle}".`);
            return rows[0].id;
        }
        console.log(`DB: Tour with title "${tourTitle}" not found.`);
        return null;
    } catch (error) {
        console.error('DB: Error getting tour ID:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log(`DB: Disconnected from database.`);
        }
    }
}

async function getTourCurrentTime(tourId) {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
   //   console.log(`DB: Connected to database for getTourCurrentTime.`);
        const [rows] = await connection.execute('SELECT tour_date, tour_time FROM tours WHERE id = ?', [tourId]);

        if (rows.length > 0) {
            const tourData = rows[0];
            // tour_date might be a Date object from mysql2, or a string.
            // Ensure it's treated as a Date object.
            const datePart = tourData.tour_date instanceof Date ? tourData.tour_date : new Date(tourData.tour_date);
            const timePart = tourData.tour_time; // This will be a string like 'HH:MM:SS'

            // Combine date and time into a single Date object
            if (timePart) {
                const [hours, minutes, seconds] = timePart.split(':').map(Number);
                datePart.setHours(hours);
                datePart.setMinutes(minutes);
                datePart.setSeconds(seconds);
                datePart.setMilliseconds(0); // Clear milliseconds for precision
            } else {
                // If timePart is null, set to 00:00:00
                datePart.setHours(0, 0, 0, 0);
            }

            console.log(`DB: Retrieved current tour time for ID ${tourId}: ${datePart.toLocaleString()}.`);
            return datePart;
        }
        console.log(`DB: No tour found with ID ${tourId} to get current time.`);
        return null;
    } catch (error) {
        console.error(`DB: Error getting current tour time for ID ${tourId}:`, error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log(`DB: Disconnected from database.`);
        }
    }
}

async function clearTourData(tourId) {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
    //  console.log(`DB: Connected to database for clearTourData.`);
      console.log(`DB: Clearing related data for tour ID: ${tourId}`);

        // IMPORTANT: Order of deletion is crucial for foreign key constraints!
        // Delete from child tables first, then parent tables.

        // 1. Get match_info_ids associated with this tour.
        const [matchInfoIdsResult] = await connection.execute(
            'SELECT id FROM match_infos WHERE tour_id = ?',
            [tourId]
        );
        const tourMatchInfoIds = matchInfoIdsResult.map(row => row.id);

        // --- Start of corrected MVCs and Votings cleanup ---

        if (tourMatchInfoIds.length > 0) {
            // Convert array of IDs to a comma-separated string for the IN clause
            // This is a workaround if direct array passing isn't working as expected with mysql2
            const matchInfoIdsString = tourMatchInfoIds.join(',');

            // Get MVC IDs linked to these match_infos
            // This assumes `mvcs` table has a `match_info_id` column to link to `match_infos`.
            // IF YOUR MVCS TABLE DOES NOT HAVE 'match_info_id', THIS WILL BE THE NEXT ERROR.
            const [mvcIdsResult] = await connection.execute(
                `SELECT id FROM mvcs WHERE match_info_id IN (${matchInfoIdsString})`
                // NO parameters needed here, as the string is already formatted.
            );
            const tourMvcIds = mvcIdsResult.map(row => row.id);

            // Convert array of MVC IDs to a comma-separated string for the IN clause
            const mvcIdsString = tourMvcIds.join(',');

            // 1. Delete records from 'votings' table.
            if (tourMvcIds.length > 0) {
                await connection.execute(
                    `DELETE FROM votings WHERE mvc_id IN (${mvcIdsString})`
                    // NO parameters needed here.
                );
            //  console.log(`DB: Cleared votings for tour ID ${tourId} (related to MVCs from match_infos).`);
            } else {
           //   console.log(`DB: No MVCs found for tour ID ${tourId} linked via match_infos, skipping votings cleanup.`);
            }

            // 2. Delete records from 'match1_answers' table.
            // Correction: The error log indicated 'match1_answers'. Using that table name.
            // If your table is actually 'match_answers', change 'match1_answers' back.
            await connection.execute(
                `DELETE FROM match1_answers WHERE match_info_id IN (${matchInfoIdsString})`
                // NO parameters needed here.
            );
         // console.log(`DB: Cleared match1_answers for tour ID ${tourId}.`);

            // 3. Delete records from 'mvcs' table.
            // Delete MVCs that are linked to the match_infos of this tour.
            // This also assumes `mvcs` has a `match_info_id` column.
            await connection.execute(
                `DELETE FROM mvcs WHERE match_info_id IN (${matchInfoIdsString})`
                // NO parameters needed here.
            );
      //    console.log(`DB: Cleared MVCs for tour ID ${tourId} (via match_infos).`);

        } else {
            console.log(`DB: No match_infos found for tour ID ${tourId}. Skipping cleanup for votings, match1_answers, and mvcs.`);
        }
        // --- End of corrected MVCs and Votings cleanup ---


        // 4. Delete records from 'match_infos' table.
        await connection.execute(
            'DELETE FROM match_infos WHERE tour_id = ?',
            [tourId]
        );
    //  console.log(`DB: Cleared match_infos for tour ID ${tourId}.`);

    //  console.log(`DB: Successfully cleared all related data for tour ID: ${tourId}.`);
        return true;
    } catch (error) {
        console.error(`DB: Error clearing data for tour ID ${tourId}:`, error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        //  console.log(`DB: Disconnected from database.`);
        }
    }
}

// --- EXISTING FUNCTION: deleteTourByTitle ---
async function deleteTourByTitle(tourTitle) {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log(`DB: Connected to database for deleteTourByTitle.`);
        console.log(`DB: Deleting tour with title: "${tourTitle}"`);

        const [tourRows] = await connection.execute('SELECT id FROM tours WHERE title = ?', [tourTitle]);
        let tourId = null;
        if (tourRows.length > 0) {
            tourId = tourRows[0].id;
        }

        const [rows] = await connection.execute('DELETE FROM tours WHERE title = ?', [tourTitle]);

        if (rows.affectedRows > 0) {
            console.log(`DB: Successfully deleted tour "${tourTitle}" (ID: ${tourId || 'N/A'}).`);
            return true;
        } else {
            console.log(`DB: No tour found with title "${tourTitle}" to delete.`);
            return false;
        }
    } catch (error) {
        console.error(`DB: Error deleting tour with title "${tourTitle}":`, error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log(`DB: Disconnected from database.`);
        }
    }
}

// Export all functions that need to be accessible from other files
module.exports = {
    updateTourStartTime,
    getTourIdByTitle,
    clearTourData,
    deleteTourByTitle,
    getTourCurrentTime
};
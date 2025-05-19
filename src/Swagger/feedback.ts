/**
 * @swagger
 * /feedback:
 *   get:
 *     summary: Get all feedbacks
 *     description: Retrieve a list of all customer feedbacks with optional filters
 *     tags: [Feedback]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, resolved, closed]
 *         description: Filter by feedback status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [general, bug, feature_request, complaint, praise]
 *         description: Filter by feedback type
 *     responses:
 *       200:
 *         description: List of feedbacks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get feedbacks successfully
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       user_id:
 *                         type: string
 *                       subject:
 *                         type: string
 *                       message:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [general, bug, feature_request, complaint, praise]
 *                       status:
 *                         type: string
 *                         enum: [pending, in_progress, resolved, closed]
 *                       admin_response:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   post:
 *     summary: Submit new feedback
 *     description: Submit a new feedback, suggestion, or bug report
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *               - type
 *             properties:
 *               subject:
 *                 type: string
 *                 description: Feedback subject
 *               message:
 *                 type: string
 *                 description: Detailed feedback message
 *               type:
 *                 type: string
 *                 enum: [general, bug, feature_request, complaint, praise]
 *                 description: Type of feedback
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Feedback submitted successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     user_id:
 *                       type: string
 *                     subject:
 *                       type: string
 *                     message:
 *                       type: string
 *                     type:
 *                       type: string
 *                     status:
 *                       type: string
 *                       default: pending
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /feedback/{feedback_id}:
 *   get:
 *     summary: Get feedback by ID
 *     description: Get detailed information about a specific feedback
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: feedback_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
 *     responses:
 *       200:
 *         description: Feedback details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get feedback successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     user_id:
 *                       type: string
 *                     subject:
 *                       type: string
 *                     message:
 *                       type: string
 *                     type:
 *                       type: string
 *                     status:
 *                       type: string
 *                     admin_response:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid feedback ID
 *       404:
 *         description: Feedback not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   put:
 *     summary: Update feedback
 *     description: Update an existing feedback (only available to the feedback creator)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedback_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *                 description: Feedback subject
 *               message:
 *                 type: string
 *                 description: Detailed feedback message
 *               type:
 *                 type: string
 *                 enum: [general, bug, feature_request, complaint, praise]
 *                 description: Type of feedback
 *     responses:
 *       200:
 *         description: Feedback updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Feedback updated successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     user_id:
 *                       type: string
 *                     subject:
 *                       type: string
 *                     message:
 *                       type: string
 *                     type:
 *                       type: string
 *                     status:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to update this feedback
 *       404:
 *         description: Feedback not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   delete:
 *     summary: Delete feedback
 *     description: Delete a feedback (only available to the feedback creator)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedback_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
 *     responses:
 *       200:
 *         description: Feedback deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Feedback deleted successfully
 *       400:
 *         description: Invalid feedback ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to delete this feedback
 *       404:
 *         description: Feedback not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /feedback/{feedback_id}/status:
 *   put:
 *     summary: Update feedback status
 *     description: Update the status of a feedback (admin only)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedback_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, resolved, closed]
 *                 description: New feedback status
 *               admin_response:
 *                 type: string
 *                 description: Admin response message
 *     responses:
 *       200:
 *         description: Feedback status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Feedback status updated successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     status:
 *                       type: string
 *                     admin_response:
 *                       type: string
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Feedback not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

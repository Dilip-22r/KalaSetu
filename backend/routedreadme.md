# API Documentation

This file contains all the Swagger documentation extracted from the route files.

## authRoutes.js

```javascript
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User registration, login, and account management
 */
```

```javascript
/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, username, password]
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Priya Sharma
 *               email:
 *                 type: string
 *                 example: priya@kalasetu.in
 *               username:
 *                 type: string
 *                 example: priya_artisan
 *               password:
 *                 type: string
 *                 example: Secret@123
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or email/username already taken
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

```javascript
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive a JWT token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: priya@kalasetu.in
 *               password:
 *                 type: string
 *                 example: Secret@123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

```javascript
/**
 * @swagger
 * /auth/upgrade-role:
 *   put:
 *     summary: Upgrade the authenticated user's role to creator
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Role upgraded successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

```javascript
/**
 * @swagger
 * /auth/user/{id}:
 *   get:
 *     summary: Get a user by their ID
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the user
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

```javascript
/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change the authenticated user's password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Old password incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

```javascript
/**
 * @swagger
 * /auth/account:
 *   delete:
 *     summary: Permanently delete the authenticated user's account
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Account deleted
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

## coreDemoRoutes.js

```javascript
/**
 * @swagger
 * tags:
 *   name: Core Demo
 *   description: Demo endpoints showcasing Node.js core module capabilities
 */
```

```javascript
/**
 * @swagger
 * /api/core-demo/os:
 *   get:
 *     summary: Get OS information from the server
 *     tags: [Core Demo]
 *     security: []
 *     responses:
 *       200:
 *         description: OS details returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 platform:
 *                   type: string
 *                   example: linux
 *                 arch:
 *                   type: string
 *                   example: x64
 *                 cpus:
 *                   type: integer
 *                   example: 4
 *                 totalMemoryMB:
 *                   type: number
 *                 freeMemoryMB:
 *                   type: number
 *                 uptime:
 *                   type: number
 *                 hostname:
 *                   type: string
 */
```

```javascript
/**
 * @swagger
 * /api/core-demo/path:
 *   get:
 *     summary: Get server path information
 *     tags: [Core Demo]
 *     security: []
 *     responses:
 *       200:
 *         description: Path details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dirname:
 *                   type: string
 *                 basename:
 *                   type: string
 *                 extname:
 *                   type: string
 *                 join:
 *                   type: string
 */
```

```javascript
/**
 * @swagger
 * /api/core-demo/events:
 *   get:
 *     summary: Trigger a custom Node.js EventEmitter event (demo)
 *     tags: [Core Demo]
 *     security: []
 *     responses:
 *       200:
 *         description: Event triggered and log returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 log:
 *                   type: array
 *                   items:
 *                     type: string
 */
```

## messageRoutes.js

```javascript
/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Direct messaging between users
 */
```

```javascript
/**
 * @swagger
 * /messages/conversations:
 *   get:
 *     summary: Get all conversations for the authenticated user
 *     tags: [Messages]
 *     responses:
 *       200:
 *         description: List of conversations with latest message previews
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   partner:
 *                     $ref: '#/components/schemas/User'
 *                   lastMessage:
 *                     $ref: '#/components/schemas/Message'
 *                   unreadCount:
 *                     type: integer
 */
```

```javascript
/**
 * @swagger
 * /messages/can-message/{userId}:
 *   get:
 *     summary: Check if the authenticated user can message a target user
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messaging permission result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 canMessage:
 *                   type: boolean
 */
```

```javascript
/**
 * @swagger
 * /messages/{userId}:
 *   get:
 *     summary: Get full message thread with a specific user
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The other user's ID
 *     responses:
 *       200:
 *         description: Array of messages in the thread
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 */
```

```javascript
/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Send a message to another user
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiverId]
 *             properties:
 *               receiverId:
 *                 type: string
 *               text:
 *                 type: string
 *                 example: Hello, I loved your work!
 *               image:
 *                 type: string
 *                 description: Base64-encoded image
 *     responses:
 *       201:
 *         description: Message sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       403:
 *         description: Cannot message this user (blocked or not following)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

```javascript
/**
 * @swagger
 * /messages/clear/{partnerId}:
 *   delete:
 *     summary: Clear entire chat history with a partner (for both sides)
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat cleared
 */
```

```javascript
/**
 * @swagger
 * /messages/{messageId}/for-me:
 *   delete:
 *     summary: Delete a message only for the authenticated user (soft delete)
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message hidden for current user
 */
```

```javascript
/**
 * @swagger
 * /messages/{messageId}:
 *   delete:
 *     summary: Delete a message for everyone
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted for all parties
 *       403:
 *         description: Not the sender
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

## notificationRoutes.js

```javascript
/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app notifications for likes, follows, comments, etc.
 */
```

```javascript
/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all notifications for the authenticated user
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
```

```javascript
/**
 * @swagger
 * /notifications/mark-read:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
```

## postRoutes.js

```javascript
/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Artisan posts — create, read, like, comment, repost
 */
```

```javascript
/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts (feed)
 *     tags: [Posts]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [event, artwork, story, workshop, announcement]
 *         description: Filter posts by category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
```

```javascript
/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get a single post by ID
 *     tags: [Posts]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

```javascript
/**
 * @swagger
 * /posts/{id}/likes:
 *   get:
 *     summary: Get list of users who liked a post
 *     tags: [Posts]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of users who liked the post
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
```

```javascript
/**
 * @swagger
 * /posts/{id}/dislikes:
 *   get:
 *     summary: Get list of users who disliked a post
 *     tags: [Posts]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of users who disliked the post
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
```

```javascript
/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post (creator role required)
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *                 example: My Madhubani Collection
 *               content:
 *                 type: string
 *                 example: Sharing my latest set of paintings...
 *               category:
 *                 type: string
 *                 enum: [event, artwork, story, workshop, announcement]
 *                 example: artwork
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [madhubani, folk-art]
 *               image:
 *                 type: string
 *                 description: Base64-encoded image string
 *     responses:
 *       201:
 *         description: Post created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       403:
 *         description: Forbidden — creator role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

```javascript
/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post (author only)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted
 *       403:
 *         description: Forbidden — not the author
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

```javascript
/**
 * @swagger
 * /posts/{id}/like:
 *   put:
 *     summary: Like or unlike a post (toggles)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Like toggled
 */
```

```javascript
/**
 * @swagger
 * /posts/{id}/dislike:
 *   put:
 *     summary: Dislike or un-dislike a post (toggles)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dislike toggled
 */
```

```javascript
/**
 * @swagger
 * /posts/{id}/repost:
 *   put:
 *     summary: Repost or un-repost a post (toggles)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Repost toggled
 */
```

```javascript
/**
 * @swagger
 * /posts/{id}/comments:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 example: Stunning work!
 *     responses:
 *       201:
 *         description: Comment added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 */
```

```javascript
/**
 * @swagger
 * /posts/{id}/comments:
 *   get:
 *     summary: Get all comments for a post
 *     tags: [Posts]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
```

```javascript
/**
 * @swagger
 * /posts/{id}/comments/{commentId}:
 *   delete:
 *     summary: Delete a specific comment
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

```javascript
/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Edit an existing post (author only)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 */
```

## profileRoutes.js

```javascript
/**
 * @swagger
 * tags:
 *   name: Profiles
 *   description: Artisan profiles, follow system, and creator directory
 */
```

```javascript
/**
 * @swagger
 * /profiles/creators:
 *   get:
 *     summary: Get list of all verified creators
 *     tags: [Profiles]
 *     security: []
 *     responses:
 *       200:
 *         description: Array of creator profiles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
```

```javascript
/**
 * @swagger
 * /profiles/{userId}/follow:
 *   put:
 *     summary: Send a follow request to a user
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Follow request sent
 *       400:
 *         description: Already following or invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

```javascript
/**
 * @swagger
 * /profiles/{userId}/accept-follow:
 *   put:
 *     summary: Accept a follow request from a user
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Follow request accepted
 */
```

```javascript
/**
 * @swagger
 * /profiles/{userId}/reject-follow:
 *   put:
 *     summary: Reject a follow request from a user
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Follow request rejected
 */
```

```javascript
/**
 * @swagger
 * /profiles/{userId}/followers:
 *   get:
 *     summary: Get the followers of a user
 *     tags: [Profiles]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of followers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
```

```javascript
/**
 * @swagger
 * /profiles/{userId}/follow-status:
 *   get:
 *     summary: Check follow status between authenticated user and target user
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Follow status object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFollowing:
 *                   type: boolean
 *                 isPending:
 *                   type: boolean
 */
```

```javascript
/**
 * @swagger
 * /profiles/{userId}/following:
 *   get:
 *     summary: Get list of users that a user is following
 *     tags: [Profiles]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users being followed
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
```

```javascript
/**
 * @swagger
 * /profiles/{userId}:
 *   get:
 *     summary: Get a user's public profile
 *     tags: [Profiles]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile data
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

```javascript
/**
 * @swagger
 * /profiles:
 *   post:
 *     summary: Create or update the authenticated user's profile
 *     tags: [Profiles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *                 example: Madhubani artist from Bihar
 *               craft:
 *                 type: string
 *                 example: Madhubani Painting
 *               location:
 *                 type: string
 *                 example: Patna, Bihar
 *               photo:
 *                 type: string
 *                 description: Base64-encoded profile photo
 *               verificationDocument:
 *                 type: string
 *                 description: Base64-encoded PDF for creator verification
 *     responses:
 *       200:
 *         description: Profile created or updated
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

## reportRoutes.js

```javascript
/**
 * @swagger
 * tags:
 *   name: Reports & Blocks
 *   description: User blocking, reporting, and admin moderation
 */
```

```javascript
/**
 * @swagger
 * /reports/block/{userId}:
 *   post:
 *     summary: Block a user
 *     tags: [Reports & Blocks]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User blocked successfully
 *       400:
 *         description: Already blocked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

```javascript
/**
 * @swagger
 * /reports/unblock/{userId}:
 *   post:
 *     summary: Unblock a previously blocked user
 *     tags: [Reports & Blocks]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User unblocked
 */
```

```javascript
/**
 * @swagger
 * /reports/blocked:
 *   get:
 *     summary: Get full list of users blocked by the authenticated user
 *     tags: [Reports & Blocks]
 *     responses:
 *       200:
 *         description: Array of blocked user objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
```

```javascript
/**
 * @swagger
 * /reports/blocked-ids:
 *   get:
 *     summary: Get just the IDs of all users blocked by authenticated user
 *     tags: [Reports & Blocks]
 *     responses:
 *       200:
 *         description: Array of blocked user IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
```

```javascript
/**
 * @swagger
 * /reports/block-status/{userId}:
 *   get:
 *     summary: Check the block status between authenticated user and target user
 *     tags: [Reports & Blocks]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Block status result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 blockedByMe:
 *                   type: boolean
 *                 blockedByThem:
 *                   type: boolean
 */
```

```javascript
/**
 * @swagger
 * /reports/report/{userId}:
 *   post:
 *     summary: Report a user for a violation
 *     tags: [Reports & Blocks]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Harassment
 *               details:
 *                 type: string
 *                 example: This user sent offensive messages.
 *     responses:
 *       201:
 *         description: Report submitted
 *       400:
 *         description: Already reported
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

```javascript
/**
 * @swagger
 * /reports/admin/pending:
 *   get:
 *     summary: Get all pending reports (admin only)
 *     tags: [Reports & Blocks]
 *     responses:
 *       200:
 *         description: List of pending user reports
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

```javascript
/**
 * @swagger
 * /reports/admin/{reportId}:
 *   put:
 *     summary: Update the status of a report (admin only)
 *     tags: [Reports & Blocks]
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [reviewed, dismissed, actioned]
 *     responses:
 *       200:
 *         description: Report updated
 */
```

## subscriptionRoutes.js

```javascript
/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Subscription plans, cart management, and checkout
 */
```

```javascript
/**
 * @swagger
 * /subscription/plans:
 *   get:
 *     summary: Get all available subscription plans
 *     tags: [Subscriptions]
 *     security: []
 *     responses:
 *       200:
 *         description: List of subscription plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                     example: Creator Pro
 *                   price:
 *                     type: number
 *                     example: 499
 *                   duration:
 *                     type: string
 *                     example: monthly
 *                   features:
 *                     type: array
 *                     items:
 *                       type: string
 */
```

```javascript
/**
 * @swagger
 * /subscription/cart/add:
 *   post:
 *     summary: Add a plan to the cart (guest or authenticated)
 *     tags: [Subscriptions]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [planId]
 *             properties:
 *               planId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Plan added to cart
 *       404:
 *         description: Plan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

```javascript
/**
 * @swagger
 * /subscription/cart:
 *   get:
 *     summary: Get the current cart (guest or authenticated)
 *     tags: [Subscriptions]
 *     security: []
 *     responses:
 *       200:
 *         description: Cart contents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 */
```

```javascript
/**
 * @swagger
 * /subscription/cart/{planId}:
 *   delete:
 *     summary: Remove a plan from the cart
 *     tags: [Subscriptions]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan removed from cart
 */
```

```javascript
/**
 * @swagger
 * /subscription/cart/merge:
 *   post:
 *     summary: Merge guest cart into authenticated user's cart after login
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: Cart merged successfully
 */
```

```javascript
/**
 * @swagger
 * /subscription/checkout:
 *   post:
 *     summary: Checkout and process the subscription purchase
 *     tags: [Subscriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 example: upi
 *     responses:
 *       200:
 *         description: Checkout successful, transaction created
 *       400:
 *         description: Empty cart or payment failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

```javascript
/**
 * @swagger
 * /subscription/transactions:
 *   get:
 *     summary: Get all subscription transactions for the authenticated user
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: List of past transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   plan:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */
```


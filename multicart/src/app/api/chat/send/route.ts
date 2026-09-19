import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const senderId = session.user.id;
    const { receiverId, text } = await req.json();

    if (!receiverId || !text) {
      return NextResponse.json(
        { message: "receiverId and text required" },
        { status: 400 }
      );
    }

    const senderObjectId = new mongoose.Types.ObjectId(senderId);
    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

    /* ---------- SAVE IN SENDER ---------- */
    await User.updateOne(
      {
        _id: senderObjectId,
        "chats.with": receiverObjectId,
      },
      {
        $push: {
          "chats.$.messages": {
            sender: senderObjectId,
            text,
            createdAt: new Date(),
          },
        },
      }
    );

    const senderHasChat = await User.findOne({
      _id: senderObjectId,
      "chats.with": receiverObjectId,
    });

    if (!senderHasChat) {
      await User.updateOne(
        { _id: senderObjectId },
        {
          $push: {
            chats: {
              with: receiverObjectId,
              messages: [
                {
                  sender: senderObjectId,
                  text,
                  createdAt: new Date(),
                },
              ],
            },
          },
        }
      );
    }

    /* ---------- SAVE IN RECEIVER ---------- */
    await User.updateOne(
      {
        _id: receiverObjectId,
        "chats.with": senderObjectId,
      },
      {
        $push: {
          "chats.$.messages": {
            sender: senderObjectId,
            text,
            createdAt: new Date(),
          },
        },
      }
    );

    const receiverHasChat = await User.findOne({
      _id: receiverObjectId,
      "chats.with": senderObjectId,
    });

    if (!receiverHasChat) {
      await User.updateOne(
        { _id: receiverObjectId },
        {
          $push: {
            chats: {
              with: senderObjectId,
              messages: [
                {
                  sender: senderObjectId,
                  text,
                  createdAt: new Date(),
                },
              ],
            },
          },
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

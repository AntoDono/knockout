import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()


def send_sms(to: str, body: str) -> str:
    """Send an SMS via Twilio. Returns the message SID."""
    account_sid = os.environ["TWILIO_ACCOUNT_SID"]
    auth_token = os.environ["TWILIO_AUTH_TOKEN"]
    from_number = os.environ["TWILIO_FROM_NUMBER"]

    client = Client(account_sid, auth_token)
    message = client.messages.create(body=body, from_=from_number, to=to)
    return message.sid

if __name__ == "__main__":
    phone_number_to_send_to = input("Enter the phone number to send the SMS to: ")
    message = input("Enter the message to send: ")
    send_sms(phone_number_to_send_to, message)
FROM python:3.7

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

RUN python codesearch/nlp.py

CMD python server.py
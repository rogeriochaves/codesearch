FROM python:3.7

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY codesearch/nlp.py codesearch/nlp.py

RUN python codesearch/nlp.py

COPY . .

CMD python codesearch/server.py

import unittest

import codesearch.model as model


class CodesearchTestCase(unittest.TestCase):
    def test_extracts_code_correctly(self):
        self.assertEqual(
            model.extract_code("showing how to use urllib.parse.urlencode()"),
            ["urllib.parse.urlencode()"]
        )

        self.assertEqual(
            model.extract_code(
                "For DataFrame objects, a string indicating either a column name or an index level name to be used to group. df.groupby('A') is just syntactic sugar for df.groupby(df"),
            ["df.groupby('A')", 'df.groupby(df']
        )

        self.assertEqual(
            model.extract_code(
                "Although this is old, here's a solution: Just put # nopep8 at the end of the line(s) that shouldn't be formatted. Hope this can still help someone!"),
            ['# nopep8']
        )

        self.assertEqual(
            model.extract_code(
                "To access an individual known param passed in the query string, you can use request.args.get('param') . This is the \"right\" way to do it, as far as I ... 11 antwoorden ·  Topantwoord: from flask import request @app.route('/data') def data(): # here we wa"),
            ["@app.route('/data') def data():", "request.args.get('param')"]
        )

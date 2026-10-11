from llmproxy import generate

if __name__ == '__main__':
    response = generate(
        model='4o-mini',
        system="""Return 'Me!'""",
        query=""""Who is the best AI?""",
        temperature=0.0,
        lastk=0,
        session_id='GenericSession'
    )

    print(response)
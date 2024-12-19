<?php
class SessionController {
    private static $sessions = [];

    public static function createSession() {
        $input = json_decode(file_get_contents('php://input'), true);
        $start = $input['start'] ?? null;
        $end = $input['end'] ?? null;

        if (!$start || !$end) {
            http_response_code(400);
            echo json_encode(['error' => 'Start and end pages are required']);
            return;
        }

        $sessionCode = uniqid();
        self::$sessions[$sessionCode] = ['start' => $start, 'end' => $end, 'active' => false];
        echo json_encode(['sessionCode' => $sessionCode]);
    }

    public static function launchSession() {
        $input = json_decode(file_get_contents('php://input'), true);
        $sessionCode = $input['sessionCode'] ?? null;

        if (!isset(self::$sessions[$sessionCode])) {
            http_response_code(404);
            echo json_encode(['error' => 'Session not found']);
            return;
        }

        self::$sessions[$sessionCode]['active'] = true;
        echo json_encode(['message' => 'Session launched']);
    }

    public static function endSession() {
        $input = json_decode(file_get_contents('php://input'), true);
        $sessionCode = $input['sessionCode'] ?? null;

        if (!isset(self::$sessions[$sessionCode])) {
            http_response_code(404);
            echo json_encode(['error' => 'Session not found']);
            return;
        }

        unset(self::$sessions[$sessionCode]);
        echo json_encode(['message' => 'Session ended']);
    }
}

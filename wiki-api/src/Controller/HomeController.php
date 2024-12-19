<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class HomeController extends AbstractController
{
    #[Route('/', name: 'app_home')]
    public function index(): Response
    {
        $commands = [
            [
                'route' => '/connect/twitch',
                'description' => 'Redirige l’utilisateur vers Twitch pour l’authentification OAuth.',
                'method' => 'GET',
            ],
            [
                'route' => '/connect/twitch/callback',
                'description' => 'Gère le retour de Twitch avec un code d’autorisation et obtient un token d’accès.',
                'method' => 'GET',
            ],
        ];

        return $this->render('home/index.html.twig', [
            'commands' => $commands,
        ]);
    }
}

package com.internship.dto;
import java.util.List;
public record NetworkOverviewResponse(
    Long connectionCount,
    List<StudentNetworkCardResponse> connections,
    List<StudentNetworkCardResponse> incomingRequests,
    List<StudentNetworkCardResponse> outgoingRequests,
    List<StudentNetworkCardResponse> suggestions
) {}
